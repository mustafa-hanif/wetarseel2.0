// Utility functions for chat functionality
export const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return formatTime(timestamp);
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
};

export const formatDateRange = (dateWindowStart: Date) => {
  const start = new Date(dateWindowStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 2);
  const today = new Date();

  // Check if the range includes today
  const isToday = start <= today && end >= today;

  if (isToday) {
    return `Today - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } else {
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
};

export const isWithinDateWindow = (
  timestamp: string,
  dateWindowStart: Date
) => {
  const messageDate = new Date(timestamp);
  console.log({ messageDate, dateWindowStart });
  const windowStart = new Date(dateWindowStart);
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowStart.getDate() + 2);

  // Set time to start/end of day for accurate comparison
  windowStart.setHours(0, 0, 0, 0);
  windowEnd.setHours(23, 59, 59, 999);
  messageDate.setHours(0, 0, 0, 0);

  return messageDate >= windowStart && messageDate <= windowEnd;
};
