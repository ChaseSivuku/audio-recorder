import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordingMeta } from '../types/recording';

const STORAGE_KEY = 'VOICE_NOTES_DB';

//get recordings
export const loadRecordings = async (): Promise<RecordingMeta []> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);

        return data ? JSON.parse(data) : []
    }
    catch(error){
        console.error("could not load recordings:", error)
        return []
    }
}

//save recordings
export const saveRecordings = async (recordings: RecordingMeta[]) => {
    try{
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recordings))
    }
    catch(error){
        console.error('could not save recording:', error)
    }
}

