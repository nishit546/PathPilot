import React, { useState, useEffect } from 'react';
import { useTravel } from '../context/TravelContext';
import { CommunityPost, Trip } from '../types';
import { communityApi } from '../api/communityApi';
import { tripsApi } from '../api/tripsApi';
import { PageLoader } from '../components/common/PageLoader';
import { Modal } from '../components/common/Modal';
import {
  MessageSquare,
  Heart,
  Share2,
  Plus,
  Sparkles,
  MapPin,
  Send,
  Copy,
  Calendar,
  DollarSign,
  CheckCircle,
  Eye,
  Search,
  ArrowRight
} from 'lucide-react';

interface CommunityFeedPageProps {
  onForkTripSuccess?: (newTripId: number | string) => void;
}

export const CommunityFeedPage: React.FC<CommunityFeedPageProps> = ({ onForkTripSuccess }) => {
  const { createTrip, fetchTrips } = useTravel();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Post modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shared Trip Viewer modal
  const [viewingSharedTrip, setViewingSharedTrip] = useState<Trip | null>(null);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  const fetchPosts = () => {
    setIsLoading(true);
    communityApi
      .getPosts({ limit: 30, search: search || undefined })
      .then(res => {
        if (res.success) {
          const list = Array.isArray(res.data) ? res.data : ((res.data as any)?.posts || []);
          setPosts(list);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, [search]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      await communityApi.createPost({
        title: newTitle.trim(),
        content: newContent.trim()
      });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewContent('');
      setSuccessNotice('Post published to Community Feed!');
      setTimeout(() => setSuccessNotice(''), 3000);
      fetchPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to publish post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View public shared trip
  const handleInspectTrip = async (shareToken?: string | null, fallbackTrip?: Trip) => {
    if (shareToken) {
      setIsLoadingShared(true);
      try {
        const res = await communityApi.getSharedTrip(shareToken);
        if (res.success && res.data?.trip) {
          setViewingSharedTrip(res.data.trip);
        }
      } catch {
        if (fallbackTrip) setViewingSharedTrip(fallbackTrip);
      } finally {
        setIsLoadingShared(false);
      }
    } else if (fallbackTrip) {
      setViewingSharedTrip(fallbackTrip);
    }
  };

  // Fork / Clone shared trip into personal account
  const handleForkTrip = async () => {
    if (!viewingSharedTrip) return;

    setIsForking(true);
    try {
      // Create clone in user's account
      const cloned = await createTrip({
        name: `${viewingSharedTrip.name || viewingSharedTrip.title} (Forked)`,
        description: `Forked from community: ${viewingSharedTrip.description || ''}`,
        startDate: viewingSharedTrip.startDate,
        endDate: viewingSharedTrip.endDate,
        totalBudget: viewingSharedTrip.totalBudget,
        visibility: 'PRIVATE',
        coverImage: viewingSharedTrip.coverImage || undefined
      });

      // Clone sections if present
      if (viewingSharedTrip.sections && viewingSharedTrip.sections.length > 0) {
        for (const sec of viewingSharedTrip.sections) {
          try {
            await tripsApi.createSection(cloned.id, {
              cityId: sec.cityId,
              startDate: sec.startDate,
              endDate: sec.endDate,
              budget: sec.budget,
              notes: sec.notes || undefined
            });
          } catch {
            // Ignore sub-section clone edge errors
          }
        }
      }

      await fetchTrips();
      setViewingSharedTrip(null);
      setSuccessNotice('Trip successfully cloned into your account!');
      setTimeout(() => setSuccessNotice(''), 3500);

      if (onForkTripSuccess) {
        onForkTripSuccess(cloned.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to copy trip.');
    } finally {
      setIsForking(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Traveler Community & Shared Itineraries
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Discover tips, trip reports, and public itineraries shared by global explorers
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.25rem',
            fontSize: '0.9rem'
          }}
        >
          <Plus size={16} />
          <span>Share Travel Post</span>
        </button>
      </div>

      {successNotice && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            background: '#e6f7eb',
            border: '1px solid #b7ebc5',
            borderRadius: 'var(--radius-md)',
            color: '#135200',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle size={18} color="#52c41a" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Search toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-silver)',
          padding: '0.85rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="input-with-icon" style={{ flex: 1 }}>
          <Search className="input-icon-left" size={16} />
          <input
            type="text"
            className="form-input"
            style={{ padding: '0.5rem 0.85rem 0.5rem 2.4rem', fontSize: '0.9rem' }}
            placeholder="Search stories, tips, and destination advice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <PageLoader message="Loading Community Feed..." />
      ) : posts.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-silver)',
            padding: '3rem 2rem',
            textAlign: 'center'
          }}
        >
          <MessageSquare size={36} color="var(--primary-flare)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            No community posts yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Be the first traveler to share itinerary advice, packing guides, or destination reviews!
          </p>
          <button onClick={() => setIsCreateOpen(true)} className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
            Create First Post
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.map(post => {
            const author = post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Traveler';
            const avatar = post.user?.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';

            return (
              <div
                key={post.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-silver)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <img
                    src={avatar}
                    alt={author}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                      {author}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Title & Content */}
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {post.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {post.content}
                </p>

                {/* Linked Trip highlight if available */}
                {post.trip && (
                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      background: 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-silver)',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <MapPin size={18} color="var(--primary-flare)" />
                      <div>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                          {post.trip.name || post.trip.title}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {post.trip.startDate} → {post.trip.endDate} | Budget: ₹{post.trip.totalBudget?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInspectTrip(post.trip?.shareToken, post.trip)}
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Eye size={13} />
                      <span>View Public Itinerary</span>
                    </button>
                  </div>
                )}

                {/* Post Footer */}
                <div style={{ display: 'flex', gap: '1.25rem', borderTop: '1px solid #f0f0f0', paddingTop: '0.85rem' }}>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Heart size={15} />
                    <span>Helpful</span>
                  </button>

                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Share2 size={15} />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Post Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Share with PathPilot Community"
        subtitle="Post travel tips, packing checklists, or highlights from your recent trips"
      >
        <form onSubmit={handleCreatePost}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Post Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 5 Must-Visit Hidden Cafes in Tokyo"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Story & Advice *</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Share what made your trip special, practical tips, or local transit advice..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish to Feed'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Shared Itinerary View Modal (Read-Only + Fork/Clone Action) */}
      {viewingSharedTrip && (
        <Modal
          isOpen={!!viewingSharedTrip}
          onClose={() => setViewingSharedTrip(null)}
          title={viewingSharedTrip.name || viewingSharedTrip.title || 'Public Trip Itinerary'}
          subtitle={`Read-Only Community Itinerary (${viewingSharedTrip.startDate} → ${viewingSharedTrip.endDate})`}
          maxWidth="700px"
        >
          <div>
            <div
              style={{
                padding: '0.85rem 1.15rem',
                background: 'var(--secondary-horizon-subtle)',
                border: '1px solid rgba(96, 168, 192, 0.3)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary-horizon)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  PUBLIC COMMUNITY ITINERARY
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Total Budget: ₹{viewingSharedTrip.totalBudget?.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={handleForkTrip}
                disabled={isForking}
                className="btn-primary"
                style={{
                  padding: '0.5rem 1.1rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Copy size={14} />
                <span>{isForking ? 'Cloning to My Account...' : 'Copy Trip (Fork)'}</span>
              </button>
            </div>

            {viewingSharedTrip.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {viewingSharedTrip.description}
              </p>
            )}

            {/* Destination stops */}
            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.65rem' }}>
              Itinerary Stops & Scheduled Activities
            </h4>

            {(!viewingSharedTrip.sections || viewingSharedTrip.sections.length === 0) ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No stops listed in this public preview.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {viewingSharedTrip.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-silver)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        Stop {idx + 1}: {sec.city?.name || `City Stop`} ({sec.city?.country})
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {sec.startDate} → {sec.endDate}
                      </span>
                    </div>

                    {sec.days && sec.days.length > 0 && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {sec.days.map(d => (
                          <div key={d.id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            • <strong>Day {d.dayNumber}</strong> ({d.date}): {d.dayActivities?.length || 0} activities scheduled
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid #f0f0f0', paddingTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setViewingSharedTrip(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
