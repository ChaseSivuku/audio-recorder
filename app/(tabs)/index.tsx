import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView, 
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { RecordingItem } from "@/src/components/RecordingItem";
import { useRecorder } from "@/src/hooks/useRecorder";
import { RecordingMeta } from "@/src/types/recording";
import { loadRecordings, saveRecordings } from "@/src/utils/storage";

export default function HomeScreen() {
    
    //All recordings
    const [recordings, setRecordings] = useState<RecordingMeta[]>([])
    //search
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    const { recording, startRecording, stopRecording } = useRecorder()

    //onPlay manager
    const [sound, setSound] = useState<Audio.Sound | null>(null)
    const [playingId, setPlayingId] = useState<string | null>(null)

    //Rename manager
    const [renameModalVisible, setRenameModalVisible] = useState(false)
    const [selectedItem, setSelectedItem] =  useState<RecordingMeta | null>(null)
    const [newTitle, setNewTitle] = useState('')

    // Load recordings on mount
    const loadAllRecordings = useCallback(async () => {
        try {
            setIsLoading(true);
            const loaded = await loadRecordings();
            setRecordings(loaded);
        } catch (error) {
            console.error('Error loading recordings:', error);
            Alert.alert('Error', 'Failed to load recordings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllRecordings();
    }, [loadAllRecordings]);

    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync().catch((error) => {
                    console.error('Error unloading sound:', error);
                });
            }
        };
    }, [sound]);

    const handleStartRecording = useCallback(async () => {
        await startRecording();
    }, [startRecording]);

    const handleStopRecording = useCallback(async () => {
        const result = await stopRecording();
        if (result) {
            const newRecording: RecordingMeta = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                uri: result.uri,
                name: `Voice Note ${new Date().toLocaleDateString()}`,
                date: new Date().toISOString(),
                durationMillis: result.duration
            };
            
            const updated = [newRecording, ...recordings];
            setRecordings(updated);
            await saveRecordings(updated);
        }
    }, [stopRecording, recordings]);

    const handlePlay = useCallback(async (item: RecordingMeta) => {
        try {
            // If already playing this item, pause it
            if (playingId === item.id && sound) {
                await sound.pauseAsync();
                setPlayingId(null);
                return;
            }

            // Stop any currently playing sound
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }

            // If playing a different item, stop current and play new
            if (playingId && playingId !== item.id) {
                setPlayingId(null);
            }

            // Configure audio mode for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            // Load and play the new sound
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: item.uri },
                { shouldPlay: true }
            );

            setSound(newSound);
            setPlayingId(item.id);

            // Handle playback status updates
            newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                if (status.isLoaded) {
                    if (status.didJustFinish) {
                        setPlayingId(null);
                        setSound(null);
                        newSound.unloadAsync().catch((error) => {
                            console.error('Error unloading sound:', error);
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Error playing audio:', error);
            Alert.alert('Error', 'Failed to play audio. The file may be corrupted or missing.');
            setPlayingId(null);
            setSound(null);
        }
    }, [playingId, sound]);

    const handleDelete = useCallback((item: RecordingMeta) => {
        Alert.alert(
            'Delete Recording',
            `Are you sure you want to delete "${item.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete file from filesystem
                            const fileInfo = await FileSystem.getInfoAsync(item.uri);
                            if (fileInfo.exists) {
                                await FileSystem.deleteAsync(item.uri, { idempotent: true });
                            }

                            // Remove from state and storage
                            const updated = recordings.filter(r => r.id !== item.id);
                            setRecordings(updated);
                            await saveRecordings(updated);

                            // If currently playing, stop it
                            if (playingId === item.id && sound) {
                                await sound.unloadAsync();
                                setSound(null);
                                setPlayingId(null);
                            }
                        } catch (error) {
                            console.error('Error deleting recording:', error);
                            Alert.alert('Error', 'Failed to delete recording');
                        }
                    }
                }
            ]
        );
    }, [recordings, playingId, sound]);

    const handleRename = useCallback((item: RecordingMeta) => {
        setSelectedItem(item);
        setNewTitle(item.name);
        setRenameModalVisible(true);
    }, []);

    const handleSaveRename = useCallback(async () => {
        if (!selectedItem || !newTitle.trim()) {
            Alert.alert('Error', 'Please enter a valid name');
            return;
        }

        try {
            const updated = recordings.map(r => 
                r.id === selectedItem.id ? { ...r, name: newTitle.trim() } : r
            );
            setRecordings(updated);
            await saveRecordings(updated);
            setRenameModalVisible(false);
            setSelectedItem(null);
            setNewTitle('');
        } catch (error) {
            console.error('Error renaming recording:', error);
            Alert.alert('Error', 'Failed to rename recording');
        }
    }, [selectedItem, newTitle, recordings]);

    // Filter recordings based on search query using useMemo for performance
    const filteredRecordings = useMemo(() => {
        if (!searchQuery.trim()) {
            return recordings;
        }
        const query = searchQuery.toLowerCase();
        return recordings.filter(recording =>
            recording.name.toLowerCase().includes(query)
        );
    }, [recordings, searchQuery]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Voice Notes</Text>
                <Text style={styles.subtitle}>{recordings.length} recording{recordings.length !== 1 ? 's' : ''}</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search recordings..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <MaterialIcons name="clear" size={20} color="#6B7280" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Recordings List */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : filteredRecordings.length === 0 ? (
                <View style={styles.centerContainer}>
                    <FontAwesome5 name="microphone-slash" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No recordings found' : 'No recordings yet'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {searchQuery ? 'Try a different search term' : 'Tap the record button to create your first voice note'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredRecordings}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <RecordingItem
                            item={item}
                            isPlaying={playingId === item.id}
                            onPlay={() => handlePlay(item)}
                            onDelete={() => handleDelete(item)}
                            onRename={() => handleRename(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Recording Button */}
            <View style={styles.recordingContainer}>
                {recording ? (
                    <TouchableOpacity
                        style={[styles.recordButton, styles.stopButton]}
                        onPress={handleStopRecording}
                    >
                        <View style={styles.recordingIndicator} />
                        <Text style={styles.recordButtonText}>Stop Recording</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.recordButton}
                        onPress={handleStartRecording}
                    >
                        <FontAwesome5 name="microphone" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Rename Modal */}
            <Modal
                visible={renameModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setRenameModalVisible(false)
                    setSelectedItem(null)
                    setNewTitle('')
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rename Recording</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newTitle}
                            onChangeText={setNewTitle}
                            placeholder="Enter new name"
                            autoFocus
                            onSubmitEditing={handleSaveRename}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setRenameModalVisible(false)
                                    setSelectedItem(null)
                                    setNewTitle('')
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveRename}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    clearButton: {
        padding: 4,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
    },
    recordingContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    recordButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    stopButton: {
        backgroundColor: '#EF4444',
        width: 'auto',
        paddingHorizontal: 24,
        borderRadius: 35,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recordingIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
    },
    recordButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#4F46E5',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
})