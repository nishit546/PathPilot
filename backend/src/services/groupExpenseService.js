const sharedExpenseRepository = require('../repositories/sharedExpenseRepository');
const sharedExpenseSplitRepository = require('../repositories/sharedExpenseSplitRepository');
const settlementRepository = require('../repositories/settlementRepository');
const tripRepository = require('../repositories/tripRepository');
const tripCollaboratorRepository = require('../repositories/tripCollaboratorRepository');
const tripActivityLogRepository = require('../repositories/tripActivityLogRepository');
const userRepository = require('../repositories/userRepository');
const tripAccessService = require('./tripAccessService');
const notificationService = require('./notificationService');
const ApiError = require('../utils/ApiError');

const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

class GroupExpenseService {
  /**
   * Validates if a user is an active member (owner or collaborator) of the trip.
   */
  async _validateTripMember(trip, userId) {
    if (String(trip.userId) === String(userId)) return true;

    const col = await tripCollaboratorRepository.findByTripAndUser(trip.id, String(userId));
    return Boolean(col);
  }

  /**
   * Retrieves all active members for a trip with basic profile data.
   */
  async _getTripMembers(trip) {
    const members = [];
    const owner = await userRepository.findById(trip.userId);
    if (owner) {
      members.push({
        id: owner.id,
        name: `${owner.firstName} ${owner.lastName}`.trim(),
        email: owner.email,
        profilePhoto: owner.profilePhoto,
        role: 'OWNER'
      });
    }

    const collabs = await tripCollaboratorRepository.findByTripId(trip.id);
    for (const c of collabs) {
      const u = await userRepository.findById(c.userId);
      if (u) {
        members.push({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          email: u.email,
          profilePhoto: u.profilePhoto,
          role: c.role
        });
      }
    }

    return members;
  }

  /**
   * Calculates calculated splits for equal, exact, and percentage split types.
   */
  _computeSplits(amount, splitType, participants = [], splits = []) {
    const computed = [];
    const totalAmount = Number(amount);

    if (splitType === 'EQUAL') {
      const count = participants.length;
      if (count === 0) throw ApiError.badRequest('At least one participant is required for EQUAL split.');

      const baseAmount = Math.floor((totalAmount / count) * 100) / 100;
      let remainder = roundToTwo(totalAmount - baseAmount * count);

      participants.forEach((userId, index) => {
        let userShare = baseAmount;
        if (remainder > 0 && index === 0) {
          userShare = roundToTwo(userShare + remainder);
        }
        computed.push({
          userId: userId,
          amount: userShare,
          percentage: roundToTwo((userShare / totalAmount) * 100)
        });
      });
    } else if (splitType === 'EXACT') {
      splits.forEach((s) => {
        const sAmount = Number(s.amount);
        computed.push({
          userId: s.userId,
          amount: sAmount,
          percentage: roundToTwo((sAmount / totalAmount) * 100)
        });
      });
    } else if (splitType === 'PERCENTAGE') {
      let allocatedTotal = 0;
      splits.forEach((s, idx) => {
        const pct = Number(s.percentage);
        let sAmount = roundToTwo((totalAmount * pct) / 100);
        if (idx === splits.length - 1) {
          sAmount = roundToTwo(totalAmount - allocatedTotal);
        } else {
          allocatedTotal = roundToTwo(allocatedTotal + sAmount);
        }
        computed.push({
          userId: String(s.userId),
          amount: sAmount,
          percentage: pct
        });
      });
    }

    return computed;
  }

  /**
   * Creates a new shared group expense.
   */
  async createSharedExpense(tripId, requesterId, data) {
    const { trip } = await tripAccessService.requirePermission(tripId, requesterId, ['OWNER', 'EDITOR']);
    const strPaidBy = data.paidBy !== undefined ? String(data.paidBy) : String(requesterId);

    // Validate paidBy belongs to trip
    const isPayerMember = await this._validateTripMember(trip, strPaidBy);
    if (!isPayerMember) {
      throw ApiError.badRequest('The user in paidBy is not an active member of this trip.');
    }

    // Determine participants
    let participantIds = [];
    if (data.splitType === 'EQUAL') {
      participantIds = Array.from(new Set((data.participants || []).map(String)));
    } else {
      participantIds = Array.from(new Set((data.splits || []).map((s) => String(s.userId))));
    }

    if (participantIds.length === 0) {
      throw ApiError.badRequest('Expense must have at least one participant.');
    }

    // Validate all participants belong to trip
    for (const pId of participantIds) {
      const isMember = await this._validateTripMember(trip, pId);
      if (!isMember) {
        throw ApiError.badRequest(`Participant user ID ${pId} is not an active member of this trip.`);
      }
    }

    const computedSplits = this._computeSplits(data.amount, data.splitType, participantIds, data.splits);

    // Create main shared expense
    const createdExpense = await sharedExpenseRepository.create({
      tripId: trip.id,
      title: data.title,
      description: data.description,
      amount: data.amount,
      category: data.category,
      paidBy: strPaidBy,
      splitType: data.splitType,
      createdBy: String(requesterId)
    });

    // Create splits
    const splitsWithMeta = computedSplits.map((s) => ({
      ...s,
      sharedExpenseId: createdExpense.id,
      tripId: trip.id
    }));
    const createdSplits = await sharedExpenseSplitRepository.createBulk(splitsWithMeta);

    // Record activity log
    const payer = await userRepository.findById(strPaidBy);
    const payerName = payer ? `${payer.firstName} ${payer.lastName}`.trim() : 'Collaborator';
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId: String(requesterId),
      action: 'EXPENSE_CREATED',
      description: `Added shared expense "${createdExpense.title}" (₹${createdExpense.amount.toLocaleString()} paid by ${payerName})`
    });

    // Emit notifications to debtors (all participants except payer)
    for (const split of createdSplits) {
      if (String(split.userId) !== strPaidBy && String(split.userId) !== String(requesterId)) {
        await notificationService.createNotification({
          userId: split.userId,
          type: 'SYSTEM',
          title: 'New Shared Expense',
          message: `You owe ₹${split.amount.toLocaleString()} for "${createdExpense.title}" (Paid by ${payerName}).`,
          relatedTripId: trip.id,
          relatedUserId: strPaidBy,
          preventDuplicate: false
        });
      }
    }

    return {
      ...createdExpense,
      paidByUser: payer ? {
        id: payer.id,
        name: `${payer.firstName} ${payer.lastName}`.trim(),
        profilePhoto: payer.profilePhoto
      } : null,
      splits: createdSplits
    };
  }

  /**
   * Retrieves shared expenses for a trip with pagination & filters.
   */
  async getSharedExpenses(tripId, userId, filters = {}) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const result = await sharedExpenseRepository.findByTripId(trip.id, filters);
    const expensesList = Array.isArray(result) ? result : (result.expenses || []);

    const populated = await Promise.all(
      expensesList.map(async (exp) => {
        const splits = await sharedExpenseSplitRepository.findByExpenseId(exp.id);
        return {
          ...exp,
          paidByUser: exp.payer || null,
          splits
        };
      })
    );

    return {
      expenses: populated,
      total: Array.isArray(result) ? result.length : (result.total || populated.length),
      page: result.page || 1,
      limit: result.limit || populated.length
    };
  }

  /**
   * Updates an existing shared expense.
   */
  async updateSharedExpense(tripId, expenseId, requesterId, data) {
    const { trip } = await tripAccessService.requirePermission(tripId, requesterId, ['OWNER', 'EDITOR']);
    const expense = await sharedExpenseRepository.findById(expenseId);
    if (!expense || expense.tripId !== trip.id) {
      throw ApiError.notFound('Shared expense not found on this trip.');
    }

    const newAmount = data.amount !== undefined ? Number(data.amount) : expense.amount;
    const newSplitType = data.splitType || expense.splitType;
    const newPaidBy = data.paidBy !== undefined ? String(data.paidBy) : expense.paidBy;

    const isPayerMember = await this._validateTripMember(trip, newPaidBy);
    if (!isPayerMember) {
      throw ApiError.badRequest('The user in paidBy is not an active member of this trip.');
    }

    let participantIds = [];
    if (data.participants || data.splits) {
      if (newSplitType === 'EQUAL') {
        participantIds = Array.from(new Set((data.participants || []).map(String)));
      } else {
        participantIds = Array.from(new Set((data.splits || []).map((s) => String(s.userId))));
      }

      for (const pId of participantIds) {
        const isMember = await this._validateTripMember(trip, pId);
        if (!isMember) {
          throw ApiError.badRequest(`Participant user ID ${pId} is not an active member of this trip.`);
        }
      }
    } else {
      const existingSplits = await sharedExpenseSplitRepository.findByExpenseId(expense.id);
      participantIds = existingSplits.map((s) => s.userId);
    }

    const computedSplits = this._computeSplits(newAmount, newSplitType, participantIds, data.splits);

    const updated = await sharedExpenseRepository.update(expense.id, {
      ...data,
      amount: newAmount,
      splitType: newSplitType,
      paidBy: newPaidBy
    });

    // Replace splits
    await sharedExpenseSplitRepository.deleteByExpenseId(expense.id);
    const splitsWithMeta = computedSplits.map((s) => ({
      ...s,
      sharedExpenseId: expense.id,
      tripId: trip.id
    }));
    const createdSplits = await sharedExpenseSplitRepository.createBulk(splitsWithMeta);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId: String(requesterId),
      action: 'EXPENSE_UPDATED',
      description: `Updated shared expense "${updated.title}"`
    });

    return {
      ...updated,
      splits: createdSplits
    };
  }

  /**
   * Deletes a shared expense.
   */
  async deleteSharedExpense(tripId, expenseId, requesterId) {
    const { trip } = await tripAccessService.requirePermission(tripId, requesterId, ['OWNER', 'EDITOR']);
    const expense = await sharedExpenseRepository.findById(expenseId);
    if (!expense || expense.tripId !== trip.id) {
      throw ApiError.notFound('Shared expense not found on this trip.');
    }

    await sharedExpenseSplitRepository.deleteByExpenseId(expense.id);
    await sharedExpenseRepository.delete(expense.id);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId: String(requesterId),
      action: 'EXPENSE_DELETED',
      description: `Deleted shared expense "${expense.title}"`
    });

    return { message: 'Shared expense deleted successfully.' };
  }

  /**
   * Calculates net balances for all members on a trip.
   */
  async getTripBalances(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const members = await this._getTripMembers(trip);
    const expenses = await sharedExpenseRepository.findAllByTripId(trip.id);
    const splits = await sharedExpenseSplitRepository.findByTripId(trip.id);
    const settlements = await settlementRepository.findAllByTripId(trip.id);
    const completedSettlements = settlements.filter((s) => s.status === 'COMPLETED');

    const balanceMap = {};
    members.forEach((m) => {
      balanceMap[m.id] = {
        userId: m.id,
        name: m.name,
        email: m.email,
        profilePhoto: m.profilePhoto,
        role: m.role,
        totalPaid: 0,
        totalOwed: 0,
        settledPaid: 0,
        settledReceived: 0,
        netBalance: 0
      };
    });

    // Sum paid amounts
    expenses.forEach((e) => {
      if (balanceMap[e.paidBy]) {
        balanceMap[e.paidBy].totalPaid = roundToTwo(balanceMap[e.paidBy].totalPaid + e.amount);
      }
    });

    // Sum owed split amounts
    splits.forEach((s) => {
      if (balanceMap[s.userId]) {
        balanceMap[s.userId].totalOwed = roundToTwo(balanceMap[s.userId].totalOwed + s.amount);
      }
    });

    // Sum completed settlements
    completedSettlements.forEach((st) => {
      if (balanceMap[st.fromUserId]) {
        balanceMap[st.fromUserId].settledPaid = roundToTwo(balanceMap[st.fromUserId].settledPaid + st.amount);
      }
      if (balanceMap[st.toUserId]) {
        balanceMap[st.toUserId].settledReceived = roundToTwo(balanceMap[st.toUserId].settledReceived + st.amount);
      }
    });

    // Calculate net balances: (totalPaid - totalOwed) + (settledPaid - settledReceived)
    const balances = Object.values(balanceMap).map((b) => {
      const net = roundToTwo((b.totalPaid - b.totalOwed) + (b.settledPaid - b.settledReceived));
      return {
        ...b,
        netBalance: net
      };
    });

    return {
      tripId: trip.id,
      balances
    };
  }

  /**
   * Calculates optimized minimal settlements required to resolve all debt.
   */
  async getOptimizedSettlements(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const { balances } = await this.getTripBalances(trip.id, userId);

    const debtors = [];
    const creditors = [];

    balances.forEach((b) => {
      if (b.netBalance < -0.01) {
        debtors.push({
          userId: b.userId,
          name: b.name,
          profilePhoto: b.profilePhoto,
          balance: Math.abs(b.netBalance)
        });
      } else if (b.netBalance > 0.01) {
        creditors.push({
          userId: b.userId,
          name: b.name,
          profilePhoto: b.profilePhoto,
          balance: b.netBalance
        });
      }
    });

    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const settlements = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const amount = roundToTwo(Math.min(debtor.balance, creditor.balance));

      if (amount > 0) {
        settlements.push({
          fromUser: {
            id: debtor.userId,
            name: debtor.name,
            profilePhoto: debtor.profilePhoto
          },
          toUser: {
            id: creditor.userId,
            name: creditor.name,
            profilePhoto: creditor.profilePhoto
          },
          amount,
          status: 'PENDING'
        });

        debtor.balance = roundToTwo(debtor.balance - amount);
        creditor.balance = roundToTwo(creditor.balance - amount);
      }

      if (debtor.balance <= 0.01) dIdx++;
      if (creditor.balance <= 0.01) cIdx++;
    }

    return {
      tripId: trip.id,
      settlements,
      totalTransactions: settlements.length
    };
  }

  /**
   * Records or marks a settlement as COMPLETED.
   */
  async completeSettlement(tripId, settlementId, requesterId, optionalData = {}) {
    const { trip } = await tripAccessService.requirePermission(tripId, requesterId, ['OWNER', 'EDITOR', 'VIEWER']);
    const strRequesterId = String(requesterId);

    let settlement = null;
    if (settlementId) {
      settlement = await settlementRepository.findById(settlementId);
    }

    // If settlement record does not exist in DB yet, create it from payload if provided
    if (!settlement) {
      if (!optionalData.fromUserId || !optionalData.toUserId || !optionalData.amount) {
        throw ApiError.notFound('Settlement not found.');
      }
      settlement = await settlementRepository.create({
        tripId: trip.id,
        fromUserId: optionalData.fromUserId,
        toUserId: optionalData.toUserId,
        amount: optionalData.amount,
        status: 'PENDING'
      });
    }

    if (settlement.tripId !== trip.id) {
      throw ApiError.badRequest('Settlement does not belong to this trip.');
    }

    if (settlement.status === 'COMPLETED') {
      throw ApiError.badRequest('This settlement has already been marked as completed.');
    }

    // Verify requester is involved or is trip owner
    const isParticipant = String(settlement.fromUserId) === strRequesterId || String(settlement.toUserId) === strRequesterId;
    const isOwner = String(trip.userId) === strRequesterId;

    if (!isParticipant && !isOwner) {
      throw ApiError.forbidden('Only parties involved in this settlement or the trip owner can complete it.');
    }

    const now = new Date().toISOString();
    const updated = await settlementRepository.updateStatus(settlement.id, 'COMPLETED', now);

    const fromUser = await userRepository.findById(settlement.fromUserId);
    const toUser = await userRepository.findById(settlement.toUserId);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId: strRequesterId,
      action: 'SETTLEMENT_COMPLETED',
      description: `Completed settlement of ₹${settlement.amount.toLocaleString()} from ${fromUser?.firstName || 'User'} to ${toUser?.firstName || 'User'}`
    });

    // Notify other party
    const targetNotifyUser = String(settlement.fromUserId) === strRequesterId ? settlement.toUserId : settlement.fromUserId;
    await notificationService.createNotification({
      userId: targetNotifyUser,
      type: 'SYSTEM',
      title: 'Settlement Completed',
      message: `Settlement of ₹${settlement.amount.toLocaleString()} was marked as completed.`,
      relatedTripId: trip.id,
      relatedUserId: strRequesterId,
      preventDuplicate: false
    });

    return {
      ...updated,
      fromUser: fromUser ? { id: fromUser.id, name: `${fromUser.firstName} ${fromUser.lastName}`.trim() } : null,
      toUser: toUser ? { id: toUser.id, name: `${toUser.firstName} ${toUser.lastName}`.trim() } : null
    };
  }

  /**
   * Retrieves historical completed settlements for a trip.
   */
  async getSettlementHistory(tripId, userId, filters = {}) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const result = await settlementRepository.findByTripId(trip.id, filters);
    const settlementsList = Array.isArray(result) ? result : (result.settlements || []);

    const populated = await Promise.all(
      settlementsList.map(async (s) => {
        return {
          ...s,
          fromUser: s.fromUser || null,
          toUser: s.toUser || null
        };
      })
    );

    return {
      settlements: populated,
      total: Array.isArray(result) ? result.length : (result.total || populated.length),
      page: result.page || 1,
      limit: result.limit || populated.length
    };
  }

  /**
   * Retrieves a personalized expense & settlement summary for the authenticated user.
   */
  async getMyExpenseSummary(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const { balances } = await this.getTripBalances(trip.id, userId);
    const { settlements } = await this.getOptimizedSettlements(trip.id, userId);

    const strUserId = String(userId);
    const userBalance = balances.find((b) => String(b.userId) === strUserId) || {
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0
    };

    const pendingPayments = settlements.filter((s) => String(s.fromUser?.id || s.fromUserId) === strUserId);
    const pendingReceivables = settlements.filter((s) => String(s.toUser?.id || s.toUserId) === strUserId);

    const historyResult = await settlementRepository.findByTripId(trip.id);

    return {
      tripId: trip.id,
      userId,
      totalPaid: userBalance.totalPaid,
      totalOwed: userBalance.totalOwed,
      netBalance: userBalance.netBalance,
      pendingPayments,
      pendingReceivables,
      settledHistoryCount: Array.isArray(historyResult) ? historyResult.length : 0
    };
  }
}

module.exports = new GroupExpenseService();
