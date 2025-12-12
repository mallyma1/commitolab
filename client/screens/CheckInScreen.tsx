import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useCreateCheckIn } from "@/hooks/useCommitments";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CheckInRouteProp = RouteProp<RootStackParamList, "CheckIn">;

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CheckInRouteProp>();
  const { commitment } = route.params;
  const createCheckIn = useCreateCheckIn();

  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const takePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Camera Not Available",
        "Run in Expo Go to use the camera feature."
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Camera access is required to take check-in photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Photo library access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      const apiUrl = getApiUrl();
      const uploadUrlEndpoint = new URL(
        "/api/objects/upload",
        apiUrl
      ).toString();

      const presignedUrlResponse = await fetch(uploadUrlEndpoint, {
        method: "POST",
        credentials: "include",
      });

      if (!presignedUrlResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL } = await presignedUrlResponse.json();
      if (!uploadURL) {
        throw new Error("No upload URL returned");
      }

      const file = new File(uri);
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const setAclResponse = await fetch(
        new URL("/api/objects/set-acl", apiUrl).toString(),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadURL }),
          credentials: "include",
        }
      );

      if (!setAclResponse.ok) {
        console.warn("Failed to set ACL, but upload succeeded");
      }

      const { objectPath } = await setAclResponse.json();
      return objectPath || uploadURL;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleCheckIn = async () => {
    setIsUploading(true);

    try {
      let mediaUrl: string | null = null;

      if (photo) {
        mediaUrl = await uploadPhoto(photo);
      }

      await createCheckIn.mutateAsync({
        commitmentId: commitment.id,
        note: note.trim() || undefined,
        mediaUrl: mediaUrl || undefined,
      });

      Alert.alert("Check-in Complete!", "Great job! Keep up your streak!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to complete check-in. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = createCheckIn.isPending || isUploading;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <View style={styles.commitmentInfo}>
        <ThemedText type="h4">{commitment.title}</ThemedText>
        <ThemedText style={{ color: theme.textSecondary }}>
          Current streak: {commitment.currentStreak} days
        </ThemedText>
      </View>

      <ThemedText style={styles.label}>Photo Proof</ThemedText>
      <View style={styles.photoContainer}>
        {photo ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            <Pressable
              style={[
                styles.retakeButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => setPhoto(null)}
            >
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.photoPlaceholder,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <Feather name="camera" size={48} color={theme.textSecondary} />
            <ThemedText
              style={[
                styles.photoPlaceholderText,
                { color: theme.textSecondary },
              ]}
            >
              Add a photo as proof (optional)
            </ThemedText>
            <View style={styles.photoButtons}>
              <Pressable
                style={[styles.photoButton, { backgroundColor: theme.primary }]}
                onPress={takePhoto}
              >
                <Feather name="camera" size={20} color="#fff" />
                <ThemedText style={styles.photoButtonText}>
                  Take Photo
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.photoButton,
                  { backgroundColor: theme.secondary },
                ]}
                onPress={pickPhoto}
              >
                <Feather name="image" size={20} color="#fff" />
                <ThemedText style={styles.photoButtonText}>Choose</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <ThemedText style={styles.label}>Note (optional)</ThemedText>
      <TextInput
        style={[
          styles.noteInput,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        placeholder="How did it go? Any thoughts?"
        placeholderTextColor={theme.textSecondary}
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Button
        onPress={handleCheckIn}
        disabled={isLoading}
        style={styles.submitButton}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          "Complete Check-in"
        )}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  commitmentInfo: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  photoContainer: {
    marginBottom: Spacing.md,
  },
  photoPlaceholder: {
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  photoPlaceholderText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  photoButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  photoButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  photoPreviewContainer: {
    position: "relative",
  },
  photoPreview: {
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    width: "100%",
  },
  retakeButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    minHeight: 100,
  },
  submitButton: {
    marginTop: Spacing.xl,
  },
});
