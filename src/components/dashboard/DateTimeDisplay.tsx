
'use client';

import { useState, useEffect } from 'react';

export function DateTimeDisplay() {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial date on mount
    setCurrentDateTime(new Date());
    // Update every second to keep the time current
    const timerId = setInterval(() => setCurrentDateTime(new Date()), 1000);
    // Cleanup interval on component unmount
    return () => clearInterval(timerId);
  }, []);

  if (!currentDateTime) {
    return (
        <div className="text-right">
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-1" />
      </div>
    );
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  };

  const formattedDate = currentDateTime.toLocaleDateString('fr-FR', dateOptions);
  const formattedTime = `${currentDateTime.toLocaleTimeString('fr-FR', timeOptions)} (TU)`;

  return (
    <div className="text-right">
      <p className="text-sm font-medium text-muted-foreground">{formattedDate}</p>
      <p className="text-lg font-semibold text-muted-foreground">{formattedTime}</p>
    </div>
  );
}
