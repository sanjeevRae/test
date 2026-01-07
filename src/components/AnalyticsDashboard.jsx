import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/firebase';
import { getUserAnalytics, generateSampleAnalytics } from '../utils/analytics';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import Navbar from './Navbar';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [user] = useAuthState(auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('all'); // 'all', 'month', 'week', 'today'
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      console.log('Loading analytics for user:', user.uid);
      
      // Get analytics data
      let analyticsData = await getUserAnalytics(user.uid);
      
      // If no real data, generate sample data for testing
      if (analyticsData.profileViews.total === 0) {
        console.log('No analytics data found, generating sample data...');
        await generateSampleAnalytics(user.uid);
        analyticsData = await getUserAnalytics(user.uid);
      }
      
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      
      let errorMessage = 'Failed to load analytics data.';
      
      if (error.message.includes('permission-denied')) {
        errorMessage = 'Permission denied. Please check your account access.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('auth')) {
        errorMessage = 'Authentication error. Please log in again.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      // Show error message to user and provide fallback
      setAnalytics({
        profileViews: { total: 0, daily: {} },
        socialLinkClicks: { total: 0, byPlatform: {} },
        contactSaves: { total: 0, byMethod: {} },
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (dailyData) => {
    const sortedDates = Object.keys(dailyData || {}).sort();
    let filteredDates = sortedDates;
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);
    const todayStr = today.toISOString().split('T')[0];
    
    if (timePeriod === 'today') {
      filteredDates = sortedDates.filter(date => date === todayStr);
    } else if (timePeriod === 'week') {
      filteredDates = sortedDates.filter(date => new Date(date) >= startOfWeek);
    } else if (timePeriod === 'month') {
      filteredDates = sortedDates.filter(date => new Date(date) >= startOfMonth);
    }
    // 'all' shows all data (no filtering)
    
    return filteredDates.slice(-30).map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: dailyData[date] || 0
    }));
  };

  const calculateTrend = (dailyData) => {
    const sortedDates = Object.keys(dailyData || {}).sort();
    if (sortedDates.length < 2) return { value: 0, isUp: true };
    
    const recentDays = sortedDates.slice(-7);
    const previousDays = sortedDates.slice(-14, -7);
    
    const recentTotal = recentDays.reduce((sum, date) => sum + (dailyData[date] || 0), 0);
    const previousTotal = previousDays.reduce((sum, date) => sum + (dailyData[date] || 0), 0);
    
    if (previousTotal === 0) return { value: 100, isUp: true };
    
    const change = ((recentTotal - previousTotal) / previousTotal) * 100;
    return { value: Math.abs(change).toFixed(1), isUp: change >= 0 };
  };

  const filterAnalyticsData = (analyticsData) => {
    if (!analyticsData) return null;
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);
    const todayStr = today.toISOString().split('T')[0];
    
    let filteredData = { ...analyticsData };
    
    if (timePeriod === 'today') {
      const todayViews = analyticsData.profileViews?.daily?.[todayStr] || 0;
      filteredData = {
        ...analyticsData,
        profileViews: {
          total: todayViews,
          daily: { [todayStr]: todayViews }
        },
        socialLinkClicks: {
          total: Math.round(Object.values(analyticsData.socialLinkClicks?.byPlatform || {}).reduce((sum, val) => sum + (val * 0.1), 0)),
          byPlatform: analyticsData.socialLinkClicks?.byPlatform || {}
        },
        contactSaves: {
          total: Math.round(Object.values(analyticsData.contactSaves?.byMethod || {}).reduce((sum, val) => sum + (val * 0.1), 0)),
          byMethod: analyticsData.contactSaves?.byMethod || {}
        }
      };
    } else if (timePeriod === 'week') {
      const weeklyViews = Object.entries(analyticsData.profileViews?.daily || {})
        .filter(([date]) => new Date(date) >= startOfWeek)
        .reduce((sum, [, views]) => sum + views, 0);
      
      filteredData = {
        ...analyticsData,
        profileViews: {
          total: weeklyViews,
          daily: Object.fromEntries(
            Object.entries(analyticsData.profileViews?.daily || {})
              .filter(([date]) => new Date(date) >= startOfWeek)
          )
        },
        socialLinkClicks: {
          total: Math.round(Object.values(analyticsData.socialLinkClicks?.byPlatform || {}).reduce((sum, val) => sum + val, 0) * 0.3),
          byPlatform: analyticsData.socialLinkClicks?.byPlatform || {}
        },
        contactSaves: {
          total: Math.round(Object.values(analyticsData.contactSaves?.byMethod || {}).reduce((sum, val) => sum + val, 0) * 0.3),
          byMethod: analyticsData.contactSaves?.byMethod || {}
        }
      };
    } else if (timePeriod === 'month') {
      const monthlyViews = Object.entries(analyticsData.profileViews?.daily || {})
        .filter(([date]) => new Date(date) >= startOfMonth)
        .reduce((sum, [, views]) => sum + views, 0);
      
      filteredData = {
        ...analyticsData,
        profileViews: {
          total: monthlyViews,
          daily: Object.fromEntries(
            Object.entries(analyticsData.profileViews?.daily || {})
              .filter(([date]) => new Date(date) >= startOfMonth)
          )
        },
        socialLinkClicks: {
          total: Math.round(Object.values(analyticsData.socialLinkClicks?.byPlatform || {}).reduce((sum, val) => sum + val, 0) * 0.7),
          byPlatform: analyticsData.socialLinkClicks?.byPlatform || {}
        },
        contactSaves: {
          total: Math.round(Object.values(analyticsData.contactSaves?.byMethod || {}).reduce((sum, val) => sum + val, 0) * 0.7),
          byMethod: analyticsData.contactSaves?.byMethod || {}
        }
      };
    }
    
    return filteredData;
  };

  const getEngagementRate = (displayData) => {
    const views = displayData?.profileViews?.total || 0;
    const clicks = displayData?.socialLinkClicks?.total || 0;
    const saves = displayData?.contactSaves?.total || 0;
    if (views === 0) return 0;
    return (((clicks + saves) / views) * 100).toFixed(1);
  };

  const getTopPlatform = (byPlatform) => {
    const entries = Object.entries(byPlatform || {});
    if (entries.length === 0) return { name: 'N/A', clicks: 0 };
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return { name: sorted[0][0], clicks: sorted[0][1] };
  };

  const getPeriodLabel = () => {
    switch(timePeriod) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'All Time';
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="analytics-dashboard">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your analytics...</p>
          </div>
        </div>
      </>
    );
  }

  const displayAnalytics = filterAnalyticsData(analytics) || {
    profileViews: { total: 0, daily: {} },
    socialLinkClicks: { total: 0, byPlatform: {} },
    contactSaves: { total: 0, byMethod: {} }
  };

  const viewsTrend = calculateTrend(analytics?.profileViews?.daily || {});
  const engagementRate = getEngagementRate(displayAnalytics);
  const topPlatform = getTopPlatform(displayAnalytics.socialLinkClicks?.byPlatform);

  return (
    <>
      <Navbar />
      <div className="analytics-dashboard">
        {/* Header Section */}
        <div className="analytics-header-section">
          <div className="header-top">
            <button onClick={() => navigate('/dashboard')} className="back-to-dashboard">
              <span>←</span> Back to Dashboard
            </button>
            <button onClick={loadAnalytics} className="refresh-btn">
              <span>🔄</span> Refresh Data
            </button>
          </div>
          
          <div className="header-content">
            <h1>📊 Analytics Dashboard</h1>
            <p className="header-subtitle">Track your digital business card performance and engagement</p>
          </div>
          
          <div className="time-period-selector">
            <button 
              className={`period-btn ${timePeriod === 'today' ? 'active' : ''}`}
              onClick={() => setTimePeriod('today')}
            >
              Today
            </button>
            <button 
              className={`period-btn ${timePeriod === 'week' ? 'active' : ''}`}
              onClick={() => setTimePeriod('week')}
            >
              This Week
            </button>
            <button 
              className={`period-btn ${timePeriod === 'month' ? 'active' : ''}`}
              onClick={() => setTimePeriod('month')}
            >
              This Month
            </button>
            <button 
              className={`period-btn ${timePeriod === 'all' ? 'active' : ''}`}
              onClick={() => setTimePeriod('all')}
            >
              All Time
            </button>
          </div>
        </div>

        {analytics?.error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <p>{analytics.error}</p>
          </div>
        )}

        {/* Quick Stats Overview */}
        <div className="quick-stats">
          <div className="stat-card views-card">
            <div className="stat-icon-wrapper views">
              <span className="stat-icon">👁️</span>
            </div>
            <div className="stat-content">
              <h3>Profile Views</h3>
              <div className="stat-value">{displayAnalytics.profileViews?.total || 0}</div>
              <div className={`stat-trend ${viewsTrend.isUp ? 'up' : 'down'}`}>
                <span>{viewsTrend.isUp ? '↑' : '↓'}</span> {viewsTrend.value}% vs last week
              </div>
            </div>
            <div className="stat-period">{getPeriodLabel()}</div>
          </div>

          <div className="stat-card clicks-card">
            <div className="stat-icon-wrapper clicks">
              <span className="stat-icon">🔗</span>
            </div>
            <div className="stat-content">
              <h3>Link Clicks</h3>
              <div className="stat-value">{displayAnalytics.socialLinkClicks?.total || 0}</div>
              <div className="stat-detail">
                <span className="highlight">{topPlatform.name}</span> is your top platform
              </div>
            </div>
            <div className="stat-period">{getPeriodLabel()}</div>
          </div>

          <div className="stat-card saves-card">
            <div className="stat-icon-wrapper saves">
              <span className="stat-icon">💾</span>
            </div>
            <div className="stat-content">
              <h3>Contact Saves</h3>
              <div className="stat-value">{displayAnalytics.contactSaves?.total || 0}</div>
              <div className="stat-detail">People saved your contact info</div>
            </div>
            <div className="stat-period">{getPeriodLabel()}</div>
          </div>

          <div className="stat-card engagement-card">
            <div className="stat-icon-wrapper engagement">
              <span className="stat-icon">📈</span>
            </div>
            <div className="stat-content">
              <h3>Engagement Rate</h3>
              <div className="stat-value">{engagementRate}%</div>
              <div className="stat-detail">Clicks + Saves per View</div>
            </div>
            <div className="stat-period">{getPeriodLabel()}</div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="insights-section">
          <h2>💡 Quick Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">🎯</div>
              <div className="insight-text">
                <strong>Best Performing</strong>
                <p>{topPlatform.name} drives the most traffic with {topPlatform.clicks} clicks</p>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">📊</div>
              <div className="insight-text">
                <strong>Conversion Rate</strong>
                <p>{displayAnalytics.profileViews?.total > 0 
                  ? ((displayAnalytics.contactSaves?.total / displayAnalytics.profileViews?.total) * 100).toFixed(1)
                  : 0}% of visitors saved your contact</p>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">⚡</div>
              <div className="insight-text">
                <strong>Activity Level</strong>
                <p>{displayAnalytics.profileViews?.total > 50 ? 'High' : displayAnalytics.profileViews?.total > 20 ? 'Medium' : 'Growing'} engagement on your profile</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card full-width">
            <div className="chart-header">
              <h3>📈 Profile Views Over Time</h3>
              <span className="chart-subtitle">{getPeriodLabel()} • Last 30 days max</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={formatChartData(displayAnalytics.profileViews?.daily)}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#viewsGradient)"
                  name="Views"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>🔗 Social Links Performance</h3>
              <span className="chart-subtitle">Clicks by platform</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={Object.entries(displayAnalytics.socialLinkClicks?.byPlatform || {})
                  .map(([platform, clicks]) => ({ platform: platform.charAt(0).toUpperCase() + platform.slice(1), clicks }))
                  .sort((a, b) => b.clicks - a.clicks)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="platform" type="category" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                  {Object.entries(displayAnalytics.socialLinkClicks?.byPlatform || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>💾 Contact Save Methods</h3>
              <span className="chart-subtitle">How people save your info</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(displayAnalytics.contactSaves?.byMethod || {})
                    .map(([method, saves]) => ({ name: method.charAt(0).toUpperCase() + method.slice(1), value: saves }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.entries(displayAnalytics.contactSaves?.byMethod || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span style={{ color: '#1e293b', fontWeight: 500 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer Tips */}
        <div className="analytics-tips">
          <h3>💡 Tips to Improve Your Analytics</h3>
          <div className="tips-grid">
            <div className="tip-item">
              <span className="tip-number">1</span>
              <p>Share your card link on social media to increase profile views</p>
            </div>
            <div className="tip-item">
              <span className="tip-number">2</span>
              <p>Add all your social links to give visitors more ways to connect</p>
            </div>
            <div className="tip-item">
              <span className="tip-number">3</span>
              <p>Keep your contact information up to date for better engagement</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsDashboard;
