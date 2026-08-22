import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TravelProvider, useTravel } from './context/TravelContext';
import { AuthPage } from './pages/AuthPage';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { TripsPage } from './pages/TripsPage';
import { ItineraryBuilderPage } from './pages/ItineraryBuilderPage';
import { TripDetailsPage } from './pages/TripDetailsPage';
import { SearchExplorePage } from './pages/SearchExplorePage';
import { CalendarViewPage } from './pages/CalendarViewPage';
import { CommunityFeedPage } from './pages/CommunityFeedPage';
import { ProfileViewPage } from './pages/ProfileViewPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CreateTripModal } from './components/trips/CreateTripModal';
import { PageLoader } from './components/common/PageLoader';
import { Trip, City } from './types';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const { isCreateTripModalOpen, setIsCreateTripModalOpen } = useTravel();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  if (isLoading) {
    return <PageLoader message="Verifying PathPilot session..." />;
  }

  if (!isAuthenticated || !currentUser) {
    return <AuthPage onAuthSuccess={() => setActiveTab('dashboard')} />;
  }

  const handleViewTrip = (trip: Trip) => {
    setSelectedTripId(Number(trip.id));
    setActiveTab('trip-details');
  };

  const handleEditItinerary = (tripId: number) => {
    setSelectedTripId(tripId);
    setActiveTab('itinerary');
  };

  const handleTripCreated = (newTripId: number) => {
    setSelectedTripId(newTripId);
    setActiveTab('itinerary');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Header */}
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Body */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <DashboardPage
            onViewTrip={handleViewTrip}
            onEditItinerary={handleEditItinerary}
          />
        )}

        {activeTab === 'trips' && (
          <TripsPage
            onViewTrip={handleViewTrip}
            onEditItinerary={handleEditItinerary}
            onPlanNewTrip={() => setIsCreateTripModalOpen(true)}
          />
        )}

        {activeTab === 'itinerary' && selectedTripId && (
          <ItineraryBuilderPage
            tripId={selectedTripId}
            onBack={() => setActiveTab('trips')}
            onViewTripDetails={(id) => {
              setSelectedTripId(id);
              setActiveTab('trip-details');
            }}
          />
        )}

        {activeTab === 'trip-details' && selectedTripId && (
          <TripDetailsPage
            tripId={selectedTripId}
            onBack={() => setActiveTab('trips')}
            onEditItinerary={(id) => {
              setSelectedTripId(id);
              setActiveTab('itinerary');
            }}
          />
        )}

        {activeTab === 'explore' && (
          <SearchExplorePage
            onPlanTripWithCity={(_city: City) => setIsCreateTripModalOpen(true)}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarViewPage onViewTrip={handleViewTrip} />
        )}

        {activeTab === 'community' && (
          <CommunityFeedPage
            onForkTripSuccess={(newTripId) => {
              setSelectedTripId(newTripId);
              setActiveTab('trip-details');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileViewPage
            onViewTrip={handleViewTrip}
            onEditItinerary={handleEditItinerary}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardPage />
        )}
      </main>

      {/* Global Plan a Trip Modal */}
      <CreateTripModal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onTripCreated={handleTripCreated}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <TravelProvider>
        <MainAppContent />
      </TravelProvider>
    </AuthProvider>
  );
}

export default App;
