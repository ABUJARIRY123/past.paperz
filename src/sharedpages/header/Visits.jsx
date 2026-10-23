import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

const Visits = () => {
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useSelector(state => state.user);
  const location = useLocation();

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    const browserInfo = {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown'
    };

    if (userAgent.includes('Firefox/')) {
      browserInfo.browser = 'Firefox';
    } else if (userAgent.includes('Chrome/')) {
      browserInfo.browser = 'Chrome';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      browserInfo.browser = 'Safari';
    } else if (userAgent.includes('Edge/')) {
      browserInfo.browser = 'Edge';
    }

    if (userAgent.includes('Windows')) {
      browserInfo.os = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      browserInfo.os = 'MacOS';
    } else if (userAgent.includes('Linux')) {
      browserInfo.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      browserInfo.os = 'Android';
    } else if (userAgent.includes('iOS')) {
      browserInfo.os = 'iOS';
    }

    if (/Mobi|Android/i.test(userAgent)) {
      browserInfo.device = 'Mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      browserInfo.device = 'Tablet';
    } else {
      browserInfo.device = 'Desktop';
    }

    return browserInfo;
  };

  const getLocationFromTimezone = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [area, location] = timeZone.split('/');
    const continent = area?.replace(/_/g, ' ') || 'Unknown';
    const city = location?.replace(/_/g, ' ') || 'Unknown';
    const offset = new Date().getTimezoneOffset();
    const utcOffset = -offset / 60;

    return {
      continent,
      city,
      timeZone,
      utcOffset: `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`
    };
  };

  const getPageName = (pathname) => {
    if (pathname.startsWith('/story-detail/')) {
      return 'About';
    }

    const pageMap = {
      '/': 'Home',
      '/about': 'About',
      '/programs': 'Programs',
      '/donate': 'Donate',
      '/contact': 'Contact',
      '/resources': 'Resources',
      '/careers': 'Careers',
      '/newsandupdates': 'News & Updates',
    };

    return pageMap[pathname] || pathname;
  };

  const getPagePath = (pathname) => {
    if (pathname.startsWith('/story-detail/')) {
      return '/about';
    }
    return pathname;
  };

  useEffect(() => {
    const logVisit = async () => {
      try {
        const visitorInfo = {
          ...getBrowserInfo(),
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          username: currentUser?.username || 'Anonymous',
          timestamp: new Date().toISOString(),
          location: getLocationFromTimezone(),
          page: getPageName(location.pathname),
          pagePath: getPagePath(location.pathname),
        };

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/visits/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ visitorInfo }),
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setTotalVisits(data.totalVisits);
        } else {
          console.error('Failed to log visit');
        }
      } catch (error) {
        console.error('Error logging visit:', error);
      } finally {
        setLoading(false);
      }
    };

    logVisit();
  }, [currentUser?.username, location.pathname]);

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {/* Loading... */}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
    </div>
  );
};

export default Visits;