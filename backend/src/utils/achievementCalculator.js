/**
 * Evaluates dynamic achievements for a user based on calculated analytics metrics.
 */
const evaluateAchievements = (metrics) => {
  const definitions = [
    {
      code: 'FIRST_TRIP',
      title: 'First Step to Adventure',
      description: 'Created your first trip itinerary on PathPilot.',
      icon: '🚀',
      category: 'MILESTONE',
      isUnlocked: (m) => m.totalTrips >= 1,
      getProgress: (m) => ({ current: Math.min(1, m.totalTrips), target: 1 })
    },
    {
      code: 'WORLD_EXPLORER',
      title: 'World Explorer',
      description: 'Explore or plan trips across 5 unique cities.',
      icon: '🌍',
      category: 'EXPLORATION',
      isUnlocked: (m) => m.uniqueCitiesCount >= 5,
      getProgress: (m) => ({ current: Math.min(5, m.uniqueCitiesCount), target: 5 })
    },
    {
      code: 'CITY_HOPPER',
      title: 'City Hopper',
      description: 'Visit and schedule itineraries in 10 or more destinations.',
      icon: '🏙️',
      category: 'EXPLORATION',
      isUnlocked: (m) => m.uniqueCitiesCount >= 10,
      getProgress: (m) => ({ current: Math.min(10, m.uniqueCitiesCount), target: 10 })
    },
    {
      code: 'ADVENTURE_SEEKER',
      title: 'Adrenaline Junkie',
      description: 'Scheduled at least 5 adventure or outdoor activities.',
      icon: '🧗',
      category: 'ACTIVITIES',
      isUnlocked: (m) => m.adventureActivitiesCount >= 5,
      getProgress: (m) => ({ current: Math.min(5, m.adventureActivitiesCount), target: 5 })
    },
    {
      code: 'BUDGET_MASTER',
      title: 'Budget Master',
      description: 'Completed trips without exceeding your initial total budget.',
      icon: '💰',
      category: 'FINANCIAL',
      isUnlocked: (m) => m.tripsWithinBudget >= 1,
      getProgress: (m) => ({ current: Math.min(1, m.tripsWithinBudget), target: 1 })
    },
    {
      code: 'SOCIAL_TRAVELER',
      title: 'Crew Captain',
      description: 'Collaborated with friends or family on a shared trip.',
      icon: '👥',
      category: 'COMMUNITY',
      isUnlocked: (m) => m.collaborativeTripsCount >= 1,
      getProgress: (m) => ({ current: Math.min(1, m.collaborativeTripsCount), target: 1 })
    },
    {
      code: 'EARLY_PLANNER',
      title: 'Early Bird Planner',
      description: 'Planned an expedition more than 30 days ahead of departure.',
      icon: '📅',
      category: 'PLANNING',
      isUnlocked: (m) => m.hasEarlyPlannedTrip,
      getProgress: (m) => ({ current: m.hasEarlyPlannedTrip ? 1 : 0, target: 1 })
    },
    {
      code: 'PACKING_PRO',
      title: 'Master Packer',
      description: 'Achieved 100% packing checklist completion on a trip.',
      icon: '🎒',
      category: 'PREPARATION',
      isUnlocked: (m) => m.hasPerfectPackingTrip,
      getProgress: (m) => ({ current: m.hasPerfectPackingTrip ? 1 : 0, target: 1 })
    }
  ];

  const unlocked = [];
  const locked = [];

  definitions.forEach((def) => {
    const isUnlocked = def.isUnlocked(metrics);
    const progress = def.getProgress(metrics);
    const achievementObj = {
      code: def.code,
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
      isUnlocked,
      progress: {
        current: progress.current,
        target: progress.target,
        percentage: Math.round((progress.current / progress.target) * 100)
      }
    };

    if (isUnlocked) {
      unlocked.push(achievementObj);
    } else {
      locked.push(achievementObj);
    }
  });

  return {
    totalUnlocked: unlocked.length,
    totalAvailable: definitions.length,
    completionPercentage: Math.round((unlocked.length / definitions.length) * 100),
    unlocked,
    locked
  };
};

module.exports = {
  evaluateAchievements
};
