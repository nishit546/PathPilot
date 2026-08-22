import React, { useState, useEffect } from 'react';
import { City, Activity } from '../types';
import { citiesApi } from '../api/citiesApi';
import { activitiesApi } from '../api/activitiesApi';
import { PageLoader } from '../components/common/PageLoader';
import { Modal } from '../components/common/Modal';
import {
  Search,
  MapPin,
  DollarSign,
  Star,
  Compass,
  Filter,
  Sparkles,
  Layers,
  ArrowUpDown,
  Clock,
  CheckCircle,
  Eye,
  Plus
} from 'lucide-react';

interface SearchExplorePageProps {
  onPlanTripWithCity?: (city: City) => void;
}

export const SearchExplorePage: React.FC<SearchExplorePageProps> = ({ onPlanTripWithCity }) => {
  const [activeTab, setActiveTab] = useState<'cities' | 'activities'>('cities');
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [maxCostFilter, setMaxCostFilter] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>('popularity-desc');

  // Details Modals
  const [selectedCityModal, setSelectedCityModal] = useState<City | null>(null);
  const [selectedActivityModal, setSelectedActivityModal] = useState<Activity | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      citiesApi.getCities({ limit: 50 }),
      activitiesApi.getActivities({ limit: 100 })
    ])
      .then(([cRes, aRes]) => {
        if (cRes.success && Array.isArray(cRes.data)) setCities(cRes.data);
        if (aRes.success && Array.isArray(aRes.data)) setActivities(aRes.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Backend live search debounce
  useEffect(() => {
    if (!search || search.trim().length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await citiesApi.searchCities(search.trim());
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCities(prev => {
            const map = new Map(prev.map(c => [c.id || c.name, c]));
            res.data.forEach(c => map.set(c.id || c.name, c));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        // Ignore live search background errors
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredCities = cities
    .filter(c => {
      const name = (c.name || '').toLowerCase();
      const country = (c.country || '').toLowerCase();
      const description = (c.description || '').toLowerCase();
      const region = (c.region || '').toLowerCase();
      const query = (search || '').toLowerCase().trim();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        country.includes(query) ||
        description.includes(query);

      let matchesRegion = true;
      if (selectedRegion && selectedRegion !== 'all') {
        const sr = selectedRegion.toLowerCase();
        matchesRegion =
          region.includes(sr) ||
          (sr.includes('asia') && (region.includes('asia') || country.includes('japan') || country.includes('india') || country.includes('thailand') || country.includes('singapore') || country.includes('vietnam') || country.includes('indonesia') || country.includes('china') || country.includes('korea'))) ||
          (sr.includes('europe') && (region.includes('europe') || country.includes('france') || country.includes('italy') || country.includes('spain') || country.includes('uk') || country.includes('germany') || country.includes('netherlands') || country.includes('switzerland') || country.includes('greece') || country.includes('austria') || country.includes('portugal'))) ||
          (sr.includes('america') && (region.includes('america') || country.includes('usa') || country.includes('united states') || country.includes('canada') || country.includes('brazil') || country.includes('mexico') || country.includes('argentina') || country.includes('peru'))) ||
          (sr.includes('middle east') && (region.includes('middle east') || country.includes('uae') || country.includes('dubai') || country.includes('egypt') || country.includes('qatar') || country.includes('turkey') || country.includes('saudi'))) ||
          (sr.includes('oceania') && (region.includes('oceania') || country.includes('australia') || country.includes('new zealand') || country.includes('fiji')));
      }

      return matchesSearch && matchesRegion;
    })
    .sort((a, b) => {
      if (sortBy === 'popularity-desc') return (b.popularity || 0) - (a.popularity || 0);
      if (sortBy === 'cost-asc') return Number(a.costIndex || 0) - Number(b.costIndex || 0);
      if (sortBy === 'cost-desc') return Number(b.costIndex || 0) - Number(a.costIndex || 0);
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  const filteredActivities = activities
    .filter(a => {
      const name = (a.name || '').toLowerCase();
      const description = (a.description || '').toLowerCase();
      const category = (a.category || '').toUpperCase();
      const query = (search || '').toLowerCase().trim();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        description.includes(query);

      const matchesCategory =
        selectedCategory === 'all' || category === selectedCategory.toUpperCase();
      const matchesCost = (a.estimatedCost || 0) <= maxCostFilter;
      return matchesSearch && matchesCategory && matchesCost;
    })
    .sort((a, b) => {
      if (sortBy === 'rating-desc' || sortBy === 'popularity-desc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'cost-asc') return (a.estimatedCost || 0) - (b.estimatedCost || 0);
      if (sortBy === 'cost-desc') return (b.estimatedCost || 0) - (a.estimatedCost || 0);
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Destination & Activity Discovery
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
          Search global cities, inspect highlights, and explore curated travel experiences
        </p>
      </div>

      {/* Main Filter & Search Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-silver)',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Toggle Mode */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('cities')}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${activeTab === 'cities' ? 'var(--primary-flare)' : 'var(--border-silver)'}`,
              background: activeTab === 'cities' ? 'var(--primary-flare)' : 'transparent',
              color: activeTab === 'cities' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTab === 'cities' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            🏙️ Destination Cities ({cities.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${activeTab === 'activities' ? 'var(--primary-flare)' : 'var(--border-silver)'}`,
              background: activeTab === 'activities' ? 'var(--primary-flare)' : 'transparent',
              color: activeTab === 'activities' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTab === 'activities' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            🎟️ Activities & Attractions ({activities.length})
          </button>
        </div>

        {/* Search & Filters Group */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
          <div className="input-with-icon" style={{ width: '220px', minWidth: '180px' }}>
            <Search className="input-icon-left" size={16} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', padding: '0.5rem 0.85rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
              placeholder={activeTab === 'cities' ? 'Search cities, countries...' : 'Search attractions...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {activeTab === 'cities' ? (
            <>
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: '140px', padding: '0.5rem 0.85rem', fontSize: '0.85rem', cursor: 'pointer' }}
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">All Regions</option>
                <option value="Asia">Asia & Pacific</option>
                <option value="Europe">Europe</option>
                <option value="Americas">Americas</option>
                <option value="Middle East">Middle East</option>
                <option value="Oceania">Oceania</option>
              </select>

              <select
                className="form-input"
                style={{ width: 'auto', minWidth: '160px', padding: '0.5rem 0.85rem', fontSize: '0.85rem', cursor: 'pointer' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popularity-desc">Highest Popularity</option>
                <option value="cost-asc">Lowest Cost Index</option>
                <option value="cost-desc">Highest Cost Index</option>
                <option value="name-asc">City Name (A-Z)</option>
              </select>
            </>
          ) : (
            <>
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: '140px', padding: '0.5rem 0.85rem', fontSize: '0.85rem', cursor: 'pointer' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="SIGHTSEEING">Sightseeing</option>
                <option value="CULTURE">Culture & Heritage</option>
                <option value="ADVENTURE">Adventure</option>
                <option value="FOOD">Food & Dining</option>
                <option value="NATURE">Nature & Parks</option>
                <option value="NIGHTLIFE">Nightlife</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max:</span>
                <select
                  className="form-input"
                  style={{ width: 'auto', minWidth: '100px', padding: '0.5rem 0.65rem', fontSize: '0.85rem', cursor: 'pointer' }}
                  value={maxCostFilter}
                  onChange={(e) => setMaxCostFilter(Number(e.target.value))}
                >
                  <option value={3000}>≤ ₹3,000</option>
                  <option value={6000}>≤ ₹6,000</option>
                  <option value={10000}>≤ ₹10,000</option>
                  <option value={25000}>≤ ₹25,000</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <PageLoader message="Loading discovery catalog..." />
      ) : activeTab === 'cities' ? (
        /* Cities Grid */
        <div>
          {filteredCities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-silver)' }}>
              <MapPin size={36} color="var(--primary-flare)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No Destinations Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                No cities matched the selected filter {selectedRegion !== 'all' ? `in region "${selectedRegion}"` : ''} {search ? `with keyword "${search}"` : ''}.
              </p>
              <button
                onClick={() => { setSearch(''); setSelectedRegion('all'); }}
                className="btn-secondary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filteredCities.map(city => (
                <div
                  key={city.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-silver)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedCityModal(city)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ height: '170px', position: 'relative' }}>
                    <img
                      src={city.imageUrl}
                      alt={city.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#ffffff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      🔥 {city.popularity}% Popularity
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {city.name}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary-horizon)', fontWeight: 700 }}>
                        {city.country}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '0.825rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        marginBottom: '1rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1
                      }}
                    >
                      {city.description}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #f0f0f0',
                        paddingTop: '0.85rem'
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Cost Index: {city.costIndex}/100
                      </span>
                      {onPlanTripWithCity && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlanTripWithCity(city);
                          }}
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                        >
                          + Plan with City
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Activities Grid */
        <div>
          {filteredActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-silver)' }}>
              <Compass size={36} color="var(--primary-flare)" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No activities found matching your filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredActivities.map(act => (
                <div
                  key={act.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-silver)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                  onClick={() => setSelectedActivityModal(act)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ height: '160px', position: 'relative' }}>
                    <img
                      src={act.imageUrl}
                      alt={act.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        left: '0.75rem',
                        background: 'var(--primary-flare)',
                        color: '#ffffff',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {act.category}
                    </span>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.65rem',
                        right: '0.75rem',
                        background: 'rgba(0,0,0,0.7)',
                        color: '#ffd700',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <Star size={12} fill="#ffd700" color="#ffd700" />
                      <span>{act.rating || '4.8'}</span>
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {act.name}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.825rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        marginBottom: '1rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1
                      }}
                    >
                      {act.description}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #f0f0f0',
                        paddingTop: '0.85rem'
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ⏱️ {Math.round((act.durationMinutes || (act.durationHours ? act.durationHours * 60 : 120)) / 60)} Hours
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-flare)' }}>
                        ₹{act.estimatedCost?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* City Details Modal */}
      {selectedCityModal && (
        <Modal
          isOpen={!!selectedCityModal}
          onClose={() => setSelectedCityModal(null)}
          title={`${selectedCityModal.name}, ${selectedCityModal.country}`}
          subtitle={`Region: ${selectedCityModal.region}`}
        >
          <div>
            <img
              src={selectedCityModal.imageUrl}
              alt={selectedCityModal.name}
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {selectedCityModal.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>POPULARITY SCORE</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-flare)' }}>{selectedCityModal.popularity}%</span>
              </div>
              <div style={{ padding: '0.85rem', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>COST INDEX</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary-horizon)' }}>{selectedCityModal.costIndex}/100</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedCityModal(null)}>
                Close
              </button>
              {onPlanTripWithCity && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    onPlanTripWithCity(selectedCityModal);
                    setSelectedCityModal(null);
                  }}
                >
                  + Plan Trip with {selectedCityModal.name}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Activity Details Modal */}
      {selectedActivityModal && (
        <Modal
          isOpen={!!selectedActivityModal}
          onClose={() => setSelectedActivityModal(null)}
          title={selectedActivityModal.name}
          subtitle={`Category: ${selectedActivityModal.category}`}
        >
          <div>
            <img
              src={selectedActivityModal.imageUrl}
              alt={selectedActivityModal.name}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {selectedActivityModal.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>RATING</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#eab308' }}>★ {selectedActivityModal.rating || '4.8'}</span>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>DURATION</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  {Math.round((selectedActivityModal.durationMinutes || (selectedActivityModal.durationHours ? selectedActivityModal.durationHours * 60 : 120)) / 60)} hrs
                </span>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>EST. COST</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-flare)' }}>₹{selectedActivityModal.estimatedCost?.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-primary" onClick={() => setSelectedActivityModal(null)}>
                Got it
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
