//format millis to minutes
export const formatDuration = (millis: number): string => {
    
    const minutes = Math.floor(millis / 1000 / 60) 
    const seconds = Math.round((millis / 1000) % 60)

    return `${minutes}: ${seconds < 10 ? '0' : ''} ${seconds}`
}

//format date string to iso
export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}