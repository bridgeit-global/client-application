import React from 'react';

export default function PageContainer({
  children,
  scrollable = false
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <div className="flex min-h-0 h-full flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pb-6">
            {children}
          </div>
        </div>
      ) : (
        <div className="h-full p-4 pb-6">{children}</div>
      )}
    </>
  );
}
