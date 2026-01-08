import { useState } from "react";
import { Audio } from 'expo-av'
import { Alert } from "react-native";

export const useRecorder = () => {

    const [recording, setRecording] = useState<Audio.Recording | null> (null)

    const [permissionResponse, requestPermission] = Audio.usePermissions();

    //Initiate recording
    const startRecording = async () => {
        try{
            //request Permission for mic
            if(permissionResponse?.status !== 'granted'){
                const resp = await requestPermission()
                if(!resp.granted) return
            }

            //recording modes - sort off - toStudy!
            await Audio.setAudioModeAsync({allowsRecordingIOS: true, playsInSilentModeIOS: true})
            //start recording
            const {recording: newRecording} = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            )

            setRecording(newRecording)
        }
        catch(error){
            Alert.alert('Error', 'could not start recording')
        }
    }

    //stop the recording
    const stopRecording = async (): Promise<{uri: string, duration: number } | null> => {
        
        if(!recording) return null;

        try{
            //stop the recording
            await recording.stopAndUnloadAsync()
            
            const uri = recording.getURI()

            const {sound, status} = await recording.createNewLoadedSoundAsync()
            const duration = ( status as any).durationMillis || 0
            
            await sound.unloadAsync()

            setRecording(null)

            if(uri){
                return {uri, duration}
            }

        }
        catch(error){
            console.error("could not stop recording", error)
        }
        return null
    }

    return {recording, startRecording, stopRecording}
}