import { db, analytics, logEvent, auth } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';

/**
 * Get device information for analytics
 */
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  return {
    type: isMobile ? 'mobile' : 'desktop',
    userAgent: userAgent.substring(0, 200)
  };
};

/**
 * Track profile view event
 */
export const trackProfileView = async (profileId, viewerInfo = {}) => {
  try {
    console.log('Tracking profile view for:', profileId);
    
    const docRef = await addDoc(collection(db, 'analytics'), {
      eventType: 'profile_view',
      profileId: profileId,
      timestamp: Timestamp.now(),
      viewerInfo: {
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        ...viewerInfo
      },
      metadata: {
        url: window.location.href,
        device: getDeviceInfo()
      }
    });

    console.log('Profile view tracked successfully:', docRef.id);

    if (analytics) {
      logEvent(analytics, 'profile_view', {
        profile_id: profileId,
        viewer_type: viewerInfo.type || 'anonymous'
      });
    }

    return true;

  } catch (error) {
    console.error('Error tracking profile view:', error);
    // Don't throw - tracking should not break the app
    return false;
  }
};

/**
 * Track social link click event
 */
export const trackSocialLinkClick = async (profileId, platform, url) => {
  try {
    console.log('Tracking social link click:', { profileId, platform, url });

    const docRef = await addDoc(collection(db, 'analytics'), {
      eventType: 'social_link_click',
      profileId: profileId,
      platform: platform,
      url: url,
      timestamp: Timestamp.now(),
      metadata: {
        referrer: document.referrer || 'direct',
        device: getDeviceInfo()
      }
    });

    console.log('Social link click tracked successfully:', docRef.id);

    if (analytics) {
      logEvent(analytics, 'social_link_click', {
        profile_id: profileId,
        platform: platform
      });
    }

    return true;

  } catch (error) {
    console.error('Error tracking social link click:', error);
    // Don't throw - tracking should not break the app
    return false;
  }
};

/**
 * Track contact save event
 */
export const trackContactSave = async (profileId, method) => {
  try {
    console.log('Tracking contact save:', { profileId, method });

    const docRef = await addDoc(collection(db, 'analytics'), {
      eventType: 'contact_save',
      profileId: profileId,
      method: method,
      timestamp: Timestamp.now(),
      metadata: {
        referrer: document.referrer || 'direct',
        device: getDeviceInfo()
      }
    });

    console.log('Contact save tracked successfully:', docRef.id);

    if (analytics) {
      logEvent(analytics, 'contact_save', {
        profile_id: profileId,
        method: method
      });
    }

    return true;

  } catch (error) {
    console.error('Error tracking contact save:', error);
    // Don't throw - tracking should not break the app
    return false;
  }
};

/**
 * Get user analytics data
 */
export const getUserAnalytics = async (userId) => {
  try {
    console.log('Getting analytics for user:', userId);
    
    // First, get all profiles for this user
    const profilesQuery = query(
      collection(db, 'profiles'),
      where('userId', '==', userId)
    );
    const profilesSnapshot = await getDocs(profilesQuery);
    
    if (profilesSnapshot.empty) {
      console.log('No profiles found for user:', userId);
      return {
        profileViews: { total: 0, daily: {} },
        socialLinkClicks: { total: 0, byPlatform: {} },
        contactSaves: { total: 0, byMethod: {} }
      };
    }

    const profileIds = profilesSnapshot.docs.map(doc => doc.id);
    console.log('Found profiles:', profileIds);

    // Get analytics for each profile separately to avoid compound query issues
    const analytics = {
      profileViews: { total: 0, daily: {} },
      socialLinkClicks: { total: 0, byPlatform: {} },
      contactSaves: { total: 0, byMethod: {} }
    };

    for (const profileId of profileIds) {
      try {
        // Get analytics for this specific profile
        const analyticsQuery = query(
          collection(db, 'analytics'),
          where('profileId', '==', profileId)
        );
        
        const analyticsSnapshot = await getDocs(analyticsQuery);
        console.log(`Found ${analyticsSnapshot.docs.length} analytics records for profile ${profileId}`);

        analyticsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const date = data.timestamp.toDate().toISOString().split('T')[0];

          switch (data.eventType) {
            case 'profile_view':
              analytics.profileViews.total++;
              analytics.profileViews.daily[date] = (analytics.profileViews.daily[date] || 0) + 1;
              break;

            case 'social_link_click':
              analytics.socialLinkClicks.total++;
              analytics.socialLinkClicks.byPlatform[data.platform] = 
                (analytics.socialLinkClicks.byPlatform[data.platform] || 0) + 1;
              break;

            case 'contact_save':
              analytics.contactSaves.total++;
              analytics.contactSaves.byMethod[data.method] = 
                (analytics.contactSaves.byMethod[data.method] || 0) + 1;
              break;
          }
        });
      } catch (profileError) {
        console.error(`Error getting analytics for profile ${profileId}:`, profileError);
        // Continue with other profiles
      }
    }

    console.log('Processed analytics:', analytics);
    return analytics;

  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw error;
  }
};

/**
 * Generate sample analytics data for testing
 */
export const generateSampleAnalytics = async (userId) => {
  try {
    console.log('Generating sample analytics for user:', userId);
    
    const profilesQuery = query(
      collection(db, 'profiles'),
      where('userId', '==', userId)
    );
    const profilesSnapshot = await getDocs(profilesQuery);
    
    let profileIds = profilesSnapshot.docs.map(doc => doc.id);
    
    if (profileIds.length === 0) {
      profileIds = [userId];
      console.log('No profiles found, using userId as profileId for testing:', profileIds);
    }
    
    const profileId = profileIds[0];
    console.log('Generating sample data for profile:', profileId);
    
    // Generate sample profile views
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      await addDoc(collection(db, 'analytics'), {
        eventType: 'profile_view',
        profileId: profileId,
        timestamp: Timestamp.fromDate(date),
        viewerInfo: {
          userAgent: 'Sample Browser',
          referrer: Math.random() > 0.5 ? 'direct' : 'social_media'
        },
        metadata: {
          url: `${window.location.origin}/profile/${profileId}`,
          device: { type: Math.random() > 0.5 ? 'desktop' : 'mobile' }
        }
      });
    }
    
    // Generate sample social link clicks
    const platforms = ['linkedin', 'instagram', 'facebook', 'tiktok', 'snapchat', 'youtube'];
    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      
      await addDoc(collection(db, 'analytics'), {
        eventType: 'social_link_click',
        profileId: profileId,
        platform: platform,
        url: `https://${platform}.com/user`,
        timestamp: Timestamp.fromDate(date),
        metadata: {
          referrer: 'profile_page',
          device: { type: Math.random() > 0.5 ? 'desktop' : 'mobile' }
        }
      });
    }
    
    // Generate sample contact saves
    const methods = ['email_click', 'vcard_download', 'phone_click'];
    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const method = methods[Math.floor(Math.random() * methods.length)];
      
      await addDoc(collection(db, 'analytics'), {
        eventType: 'contact_save',
        profileId: profileId,
        method: method,
        timestamp: Timestamp.fromDate(date),
        metadata: {
          referrer: 'profile_page',
          device: { type: Math.random() > 0.5 ? 'desktop' : 'mobile' }
        }
      });
    }
    
    console.log('Sample analytics generated successfully');
    
  } catch (error) {
    console.error('Error generating sample analytics:', error);
    throw error;
  }
};