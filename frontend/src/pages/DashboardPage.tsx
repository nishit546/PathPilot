import React from 'react';
import { HeroBanner } from '../components/dashboard/HeroBanner';
import { SearchToolbar } from '../components/dashboard/SearchToolbar';
import { TopRegionalSelections } from '../components/dashboard/TopRegionalSelections';
import { PreviousTripsGrid } from '../components/dashboard/PreviousTripsGrid';
import { FloatingPlanButton } from '../components/dashboard/FloatingPlanButton';
import { Trip } from '../types';

interface DashboardPageProps {
  onViewTrip?: (trip: Trip) => void;
  onEditItinerary?: (tripId: number | string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onViewTrip, onEditItinerary }) => {
  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Hero Welcome Banner */}
      <HeroBanner />

      {/* 2. Universal Control Toolbar (Search, Group by, Filter, Sort by...) */}
      <SearchToolbar />

      {/* 3. Section 1: Top Regional Selections */}
      <TopRegionalSelections />

      {/* 4. Section 2: Previous & Active Trips Grid */}
      <PreviousTripsGrid onViewTrip={onViewTrip} onEditItinerary={onEditItinerary} />

      {/* 5. Floating + Plan a trip CTA Button */}
      <FloatingPlanButton />
    </div>
  );
};

export default DashboardPage;
