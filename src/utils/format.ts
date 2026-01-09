/**
 * Format milliseconds to MM:SS format
 * @param millis Duration in milliseconds
 * @returns Formatted string in MM:SS format
 */
export const formatDuration = (millis: number): string => {
    if (!Number.isFinite(millis) || millis < 0) {
        return '0:00';
    }
    
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format ISO date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2:30 PM")
 */
export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
};