import React, { useState, useEffect } from 'react';
import { useTravel } from '../../context/TravelContext';
import { useAuth } from '../../context/AuthContext';
import { City } from '../../types';
import { citiesApi } from '../../api/citiesApi';
import { X, Calendar, DollarSign, MapPin, Sparkles, Check, AlertCircle } from 'lucide-react';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated?: (tripId: number) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onTripCreated
}) => {
  const { createTrip } = useTravel();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalBudget, setTotalBudget] = useState(75000);
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Default dates: next week
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

      setStartDate(nextWeek.toISOString().split('T')[0]);
      setEndDate(twoWeeks.toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen]);

  // Load cities catalog from backend
  useEffect(() => {
    if (isOpen) {
      setIsLoadingCities(true);
      citiesApi
        .getCities({ limit: 20 })
        .then(res => {
          if (res.success && Array.isArray(res.data)) {
            setAvailableCities(res.data);
            if (res.data.length > 0 && !selectedCityId) {
              setSelectedCityId(res.data[0].id);
            }
          }
        })
        .catch(err => console.warn('Could not load cities:', err))
        .finally(() => setIsLoadingCities(false));
    }
  }, [isOpen, selectedCityId]);

  if (!isOpen) return null;

  const filteredCities = availableCities.filter(
    c =>
      !citySearch ||
      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.country.toLowerCase().includes(citySearch.toLowerCase())
  );

  const calculateDuration = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return null;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${days} Days / ${days - 1} Nights`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a name for your journey.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select valid departure and return dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Departure date cannot be after the return date.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const selectedCity = availableCities.find(c => c.id === selectedCityId);
      const createdTrip = await createTrip({
        name: title.trim(),
        description: description.trim() || `Exciting personalized itinerary curated by ${currentUser?.name || 'Traveler'}.`,
        startDate,
        endDate,
        totalBudget: Number(totalBudget) || 50000,
        visibility,
        coverImage: selectedCity?.imageUrl || undefined,
        initialCityId: selectedCityId || undefined
      });

      onClose();
      if (onTripCreated) {
        onTripCreated(createdTrip.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.25rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-silver)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-silver)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-canvas)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-flare)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                Plan a New Trip
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Step 1: Set your journey details & pick your starting stop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#fff1f0',
                border: '1px solid #ffccc7',
                borderRadius: 'var(--radius-md)',
                color: '#cf1322',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Trip Name */}
          <div className="form-group" style={{ marginBottom: '1.1rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Trip Title / Journey Name *</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}
              placeholder="e.g. Alpine Swiss Discovery & Scenic Rail"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Start Date, End Date, and Auto-Calculated Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Departure Date *</label>
              <div className="input-with-icon">
                <Calendar className="input-icon-left" size={16} />
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.7rem 0.85rem 0.7rem 2.4rem', fontSize: '0.9rem' }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Return Date *</label>
              <div className="input-with-icon">
                <Calendar className="input-icon-left" size={16} />
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.7rem 0.85rem 0.7rem 2.4rem', fontSize: '0.9rem' }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {calculateDuration() && (
            <div
              style={{
                marginTop: '-0.5rem',
                marginBottom: '1.1rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--secondary-horizon)',
                background: 'var(--secondary-horizon-subtle)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>⏱️ Estimated Duration:</span>
              <span>{calculateDuration()}</span>
            </div>
          )}

          {/* Starting Destination Selection */}
          <div className="form-group" style={{ marginBottom: '1.1rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              Select Initial Stop / Starting City
            </label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem', marginBottom: '0.65rem' }}
              placeholder="Search destination cities..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />

            {isLoadingCities ? (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Loading destination catalog...</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '0.65rem',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  padding: '0.25rem'
                }}
              >
                {filteredCities.map(city => {
                  const isSelected = selectedCityId === city.id;
                  return (
                    <div
                      key={city.id}
                      onClick={() => setSelectedCityId(city.id)}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: `2px solid ${isSelected ? 'var(--primary-flare)' : 'var(--border-silver)'}`,
                        height: '75px',
                        boxShadow: isSelected ? '0 4px 12px rgba(255, 72, 0, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img
                        src={city.imageUrl}
                        alt={city.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          padding: '0.4rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          color: '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {isSelected && (
                            <span
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: 'var(--primary-flare)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Check size={10} color="#fff" />
                            </span>
                          )}
                        </div>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', lineHeight: 1.1 }}>
                            {city.name}
                          </span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>{city.country}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Budget & Visibility */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>
                Overall Journey Budget ({currentUser?.currency || 'INR'} ₹)
              </label>
              <div className="input-with-icon">
                <DollarSign className="input-icon-left" size={16} />
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  className="form-input"
                  style={{ padding: '0.7rem 0.85rem 0.7rem 2.4rem', fontSize: '0.9rem' }}
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Visibility</label>
              <select
                className="form-input"
                style={{ padding: '0.7rem 0.85rem', fontSize: '0.9rem', cursor: 'pointer' }}
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
              >
                <option value="PRIVATE">🔒 Private Trip</option>
                <option value="PUBLIC">🌍 Public & Shared</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Trip Description & Notes</label>
            <textarea
              className="form-input"
              rows={2}
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.88rem', resize: 'none' }}
              placeholder="Highlight special highlights, packing notes, or travel goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.9rem' }}
            >
              {isSubmitting ? 'Creating Journey...' : 'Create & Build Itinerary →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
