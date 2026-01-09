import { useState, useCallback } from "react";
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Alert } from "react-native";

interface RecordingResult {
    uri: string;
    duration: number;
}

export const useRecorder = () => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // Initiate recording
    const startRecording = useCallback(async (): Promise<void> => {
        try {
            // Request permission for microphone
            if (permissionResponse?.status !== 'granted') {
                const resp = await requestPermission();
                if (!resp.granted) {
                    Alert.alert(
                        'Permission Required',
                        'Microphone permission is required to record audio.'
                    );
                    return;
                }
            }

            // Configure audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            // Start recording with high quality preset
            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
        } catch (error) {
            console.error('Error starting recording:', error);
            Alert.alert('Error', 'Could not start recording. Please try again.');
        }
    }, [permissionResponse, requestPermission]);

    // Stop the recording
    const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
        if (!recording) {
            return null;
        }

        try {
            // Stop and unload the recording
            await recording.stopAndUnloadAsync();
            
            const uri = recording.getURI();
            if (!uri) {
                throw new Error('Recording URI is null');
            }

            // Get duration from recording status
            const { sound, status } = await recording.createNewLoadedSoundAsync();
            
            // Properly type the status
            let duration = 0;
            if (status.isLoaded && 'durationMillis' in status) {
                duration = status.durationMillis || 0;
            }

            // Clean up the sound object
            await sound.unloadAsync();

            setRecording(null);

            return { uri, duration };
        } catch (error) {
            console.error('Error stopping recording:', error);
            Alert.alert('Error', 'Could not stop recording. Please try again.');
            setRecording(null);
            return null;
        }
    }, [recording]);

    return { recording, startRecording, stopRecording };
};