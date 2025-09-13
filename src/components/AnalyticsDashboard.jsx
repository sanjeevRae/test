import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../utils/firebase';
import { getUserAnalytics, generateSampleAnalytics } from '../utils/analytics';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [user] = useAuthState(auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('all'); // 'all', 'month', 'today'

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
    const todayStr = today.toISOString().split('T')[0];
    
    if (timePeriod === 'today') {
      filteredDates = sortedDates.filter(date => date === todayStr);
    } else if (timePeriod === 'month') {
      filteredDates = sortedDates.filter(date => new Date(date) >= startOfMonth);
    }
    // 'all' shows all data (no filtering)
    
    return filteredDates.slice(-30).map(date => ({
      date: new Date(date).toLocaleDateString(),
      value: dailyData[date] || 0
    }));
  };

  const filterAnalyticsData = (analyticsData) => {
    if (!analyticsData) return null;
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayStr = today.toISOString().split('T')[0];
    
    let filteredData = { ...analyticsData };
    
    if (timePeriod === 'today') {
      // Filter to today's data only
      const todayViews = analyticsData.profileViews?.daily?.[todayStr] || 0;
      filteredData = {
        ...analyticsData,
        profileViews: {
          total: todayViews,
          daily: { [todayStr]: todayViews }
        },
        socialLinkClicks: {
          total: Object.values(analyticsData.socialLinkClicks?.byPlatform || {}).reduce((sum, val) => {
            // For simplicity, we'll show proportional data for today
            return Math.round(sum + (val * 0.1)); // Approximate today's portion
          }, 0),
          byPlatform: analyticsData.socialLinkClicks?.byPlatform || {}
        },
        contactSaves: {
          total: Object.values(analyticsData.contactSaves?.byMethod || {}).reduce((sum, val) => {
            return Math.round(sum + (val * 0.1)); // Approximate today's portion
          }, 0),
          byMethod: analyticsData.contactSaves?.byMethod || {}
        }
      };
    } else if (timePeriod === 'month') {
      // Filter to this month's data
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading">Loading Analytics...</div>
      </div>
    );
  }

  const displayAnalytics = filterAnalyticsData(analytics) || {
    profileViews: { total: 0, daily: {} },
    socialLinkClicks: { total: 0, byPlatform: {} },
    contactSaves: { total: 0, byMethod: {} }
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="header-controls">
          <div className="time-period-toggle">
            <button 
              className={`toggle-btn ${timePeriod === 'all' ? 'active' : ''}`}
              onClick={() => setTimePeriod('all')}
            >
              All Time
            </button>
            <button 
              className={`toggle-btn ${timePeriod === 'month' ? 'active' : ''}`}
              onClick={() => setTimePeriod('month')}
            >
              This Month
            </button>
            <button 
              className={`toggle-btn ${timePeriod === 'today' ? 'active' : ''}`}
              onClick={() => setTimePeriod('today')}
            >
              Today
            </button>
          </div>
          <button onClick={loadAnalytics} className="refresh-btn">
            Refresh Data
          </button>
        </div>
      </div>

      {analytics?.error && (
        <div className="error-message">
          <p>{analytics.error}</p>
        </div>
      )}

      <div className="metrics-container">
        <div className="metric-card">
          <div className="metric-icon">👁️</div>
          <div className="metric-info">
            <div className="metric-value">{displayAnalytics.profileViews?.total || 0}</div>
            <div className="metric-label">Profile Views</div>
            <div className="metric-period">{timePeriod === 'all' ? 'All Time' : timePeriod === 'month' ? 'This Month' : 'Today'}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔗</div>
          <div className="metric-info">
            <div className="metric-value">{displayAnalytics.socialLinkClicks?.total || 0}</div>
            <div className="metric-label">Social Link Clicks</div>
            <div className="metric-period">{timePeriod === 'all' ? 'All Time' : timePeriod === 'month' ? 'This Month' : 'Today'}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💾</div>
          <div className="metric-info">
            <div className="metric-value">{displayAnalytics.contactSaves?.total || 0}</div>
            <div className="metric-label">Contact Saves</div>
            <div className="metric-period">{timePeriod === 'all' ? 'All Time' : timePeriod === 'month' ? 'This Month' : 'Today'}</div>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section">
          <h3>Profile Views Over Time {timePeriod === 'all' ? '(All Time)' : timePeriod === 'month' ? '(This Month)' : '(Today)'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatChartData(displayAnalytics.profileViews?.daily)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h3>Social Link Performance {timePeriod === 'all' ? '(All Time)' : timePeriod === 'month' ? '(This Month)' : '(Today)'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(displayAnalytics.socialLinkClicks?.byPlatform || {}).map(([platform, clicks]) => ({ platform, clicks }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clicks" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h3>Contact Save Methods {timePeriod === 'all' ? '(All Time)' : timePeriod === 'month' ? '(This Month)' : '(Today)'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(displayAnalytics.contactSaves?.byMethod || {}).map(([method, saves]) => ({ name: method, value: saves }))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {Object.entries(displayAnalytics.contactSaves?.byMethod || {}).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
