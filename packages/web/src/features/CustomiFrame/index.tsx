import React, { useState, useEffect } from 'react';

export const CustomiFrame: React.FC<CustomiFrameProps> = ({
  activepiecesUrl = 'http://localhost:4200',
  token,
  projectId = 'default',
  flowId,
  viewMode = 'builder',
  customRoute,
  hideHeader = true,
  disableNavigation = true,
  height = '100%',
  width = '100%',
  title = 'Embedded Activepieces Canvas',
  className = '',
}) => {
  const [loading, setLoading] = useState(true);

  const baseUrl = activepiecesUrl.replace(/\/$/, '');

  // 1. Dynamic Route Generator for Multiple URLs
  const getTargetRoute = () => {
    if (customRoute) return customRoute;

    switch (viewMode) {
      case 'builder':
        return flowId
          ? `/projects/${projectId}/flows/${flowId}`
          : `/projects/${projectId}/flows/new`;
      case 'flows_list':
        return `/projects/${projectId}/automations`;
      case 'runs':
        return `/projects/${projectId}/runs`;
      case 'connections':
        return `/projects/${projectId}/connections`;
      default:
        return `/projects/${projectId}/automations`;
    }
  };

  // 2. Build Multi-URL Embed String with Query Params & Token
  const targetRoute = getTargetRoute();
  let iframeUrl = `${baseUrl}/embed?embed=true`;

  if (hideHeader) {
    iframeUrl += '&hidePageHeader=true';
  }

  if (disableNavigation) {
    iframeUrl += '&disableNavigationInBuilder=true';
  }

  if (token) {
    iframeUrl += `&token=${token}`;
  }

  // Pass initial route so iframe opens specific page (builder, flows list, runs etc.)
  iframeUrl += `&initialRoute=${encodeURIComponent(targetRoute)}`;

  useEffect(() => {
    setLoading(true);
    console.log(`[CustomiFrame Debug] Mode: ${viewMode} | URL: ${iframeUrl}`);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [viewMode, flowId, projectId, iframeUrl]);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #cbd5e1',
        backgroundColor: '#0f172a',
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #334155',
              borderTopColor: '#8142e3',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p
            style={{
              marginTop: '14px',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Loading Activepieces ({viewMode})...
          </p>
        </div>
      )}

      <iframe
        src={iframeUrl}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        allow="clipboard-read; clipboard-write"
        title={title}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

export interface CustomiFrameProps {
  activepiecesUrl?: string;
  token?: string;
  projectId?: string;
  flowId?: string;
  viewMode?: 'builder' | 'flows_list' | 'runs' | 'connections' | 'custom_route';
  customRoute?: string;
  hideHeader?: boolean;
  disableNavigation?: boolean;
  height?: string;
  width?: string;
  title?: string;
  className?: string;
}

export default CustomiFrame;
