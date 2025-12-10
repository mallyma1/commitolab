import React, { useState } from "react";
import { View, StyleSheet, Image, TextInput, Pressable, Alert, Modal, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useCommitments } from "@/hooks/useCommitments";
import { Spacing, BorderRadius } from "@/constants/theme";

const avatarPresets = [
  { id: "yoga", source: require("../assets/avatars/yoga.png") },
  { id: "mountain", source: require("../assets/avatars/mountain.png") },
  { id: "zen", source: require("../assets/avatars/zen.png") },
  { id: "running", source: require("../assets/avatars/running.png") },
  { id: "book", source: require("../assets/avatars/book.png") },
  { id: "creative", source: require("../assets/avatars/creative.png") },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const { data: commitments } = useCommitments();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isEditing, setIsEditing] = useState(false);

  const totalCommitments = commitments?.length || 0;
  const bestStreak = commitments?.reduce((max, c) => Math.max(max, c.longestStreak), 0) || 0;
  const activeCommitments = commitments?.filter((c) => c.active).length || 0;

  const currentAvatar = avatarPresets.find((a) => a.id === user?.avatarPreset) || avatarPresets[0];

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Account Deletion", "Please contact support to delete your account.");
          },
        },
      ]
    );
  };

  const handleSaveDisplayName = async () => {
    if (displayName !== user?.displayName) {
      try {
        await updateUser({ displayName: displayName.trim() });
      } catch (error) {
        Alert.alert("Error", "Failed to update display name");
      }
    }
    setIsEditing(false);
  };

  const handleSelectAvatar = async (avatarId: string) => {
    try {
      await updateUser({ avatarPreset: avatarId });
      setShowAvatarModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update avatar");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileHeader}>
        <Pressable onPress={() => setShowAvatarModal(true)}>
          <View style={styles.avatarContainer}>
            <Image source={currentAvatar.source} style={styles.avatar} />
            <View style={[styles.editAvatarBadge, { backgroundColor: theme.primary }]}>
              <Feather name="edit-2" size={12} color="#fff" />
            </View>
          </View>
        </Pressable>

        {isEditing ? (
          <View style={styles.nameEditContainer}>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display Name"
              placeholderTextColor={theme.textSecondary}
              autoFocus
            />
            <Pressable
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveDisplayName}
            >
              <Feather name="check" size={20} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setIsEditing(true)} style={styles.nameRow}>
            <ThemedText type="h3">{user?.displayName || "Set your name"}</ThemedText>
            <Feather name="edit-2" size={16} color={theme.textSecondary} />
          </Pressable>
        )}

        <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
          {user?.email}
        </ThemedText>
        <ThemedText style={[styles.memberSince, { color: theme.textSecondary }]}>
          Member since {formatDate(user?.createdAt)}
        </ThemedText>
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Statistics
      </ThemedText>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${theme.primary}20` }]}>
            <Feather name="target" size={24} color={theme.primary} />
          </View>
          <ThemedText style={styles.statValue}>{totalCommitments}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Total Commitments
          </ThemedText>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${theme.accent}20` }]}>
            <Feather name="award" size={24} color={theme.accent} />
          </View>
          <ThemedText style={styles.statValue}>{bestStreak}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Best Streak
          </ThemedText>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${theme.secondary}20` }]}>
            <Feather name="zap" size={24} color={theme.secondary} />
          </View>
          <ThemedText style={styles.statValue}>{activeCommitments}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Active Now
          </ThemedText>
        </Card>
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Account
      </ThemedText>

      <Pressable
        style={[styles.menuItem, { borderColor: theme.border }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={20} color={theme.error} />
        <ThemedText style={[styles.menuItemText, { color: theme.error }]}>
          Log Out
        </ThemedText>
      </Pressable>

      <Pressable
        style={[styles.menuItem, { borderColor: theme.border }]}
        onPress={handleDeleteAccount}
      >
        <Feather name="trash-2" size={20} color={theme.error} />
        <ThemedText style={[styles.menuItemText, { color: theme.error }]}>
          Delete Account
        </ThemedText>
      </Pressable>

      <Modal
        visible={showAvatarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAvatarModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
          >
            <ThemedText type="h4" style={styles.modalTitle}>
              Choose Avatar
            </ThemedText>
            <View style={styles.avatarGrid}>
              {avatarPresets.map((avatar) => (
                <Pressable
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    user?.avatarPreset === avatar.id && {
                      borderColor: theme.primary,
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => handleSelectAvatar(avatar.id)}
                >
                  <Image source={avatar.source} style={styles.avatarOptionImage} />
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  nameEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    width: "100%",
    maxWidth: 300,
  },
  nameInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    textAlign: "center",
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  email: {
    marginTop: Spacing.xs,
  },
  memberSince: {
    marginTop: Spacing.xs,
    fontSize: 13,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
    alignItems: "center",
    padding: Spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
  },
  avatarOption: {
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarOptionImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
});
