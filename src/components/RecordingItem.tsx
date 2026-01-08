import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { RecordingMeta } from "../types/recording";
import { formatDate, formatDuration } from "../utils/format";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

interface Props {
  item: RecordingMeta;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export const RecordingItem: React.FC<Props> = ({
  item,
  isPlaying,
  onPlay,
  onDelete,
  onRename,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.date}>
          {formatDate(item.date)} • {formatDuration(item.durationMillis)}
        </Text>
      </View>

      <View style={styles.actions}>
        {/* play button */}
        <TouchableOpacity onPress={onPlay} style={styles.iconBtn}>
          <FontAwesome5
            name={isPlaying ? "pause" : "play"}
            size={16}
            color="#4F46E5"
          />
        </TouchableOpacity>

        {/* rename */}
        <TouchableOpacity onPress={onRename} style={styles.iconBtn}>
          <MaterialIcons name="edit" size={20} color="#555"></MaterialIcons>
        </TouchableOpacity>

        {/* delete */}
        <TouchableOpacity>
          <MaterialIcons
            name="delete"
            size={20}
            color="#EF4444"
          ></MaterialIcons>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#6B7280",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
});
