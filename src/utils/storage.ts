import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordingMeta } from '../types/recording';

const STORAGE_KEY = 'VOICE_NOTES_DB';

/**
 * Load all recordings from persistent storage
 * @returns Promise resolving to an array of RecordingMeta objects
 */
export const loadRecordings = async (): Promise<RecordingMeta[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (!data) {
            return [];
        }
        const parsed = JSON.parse(data) as RecordingMeta[];
        // Validate that we got an array
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Could not load recordings:', error);
        return [];
    }
};

/**
 * Save recordings to persistent storage
 * @param recordings Array of RecordingMeta objects to save
 * @returns Promise that resolves when save is complete
 */
export const saveRecordings = async (recordings: RecordingMeta[]): Promise<void> => {
    try {
        if (!Array.isArray(recordings)) {
            throw new Error('Recordings must be an array');
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
    } catch (error) {
        console.error('Could not save recordings:', error);
        throw error; // Re-throw to allow caller to handle
    }
};

