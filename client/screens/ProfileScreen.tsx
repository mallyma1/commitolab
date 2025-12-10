import React, { useState } from "react";
import { View, StyleSheet, Image, TextInput, Pressable, Alert, Modal, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { HabitProfileCard } from "@/components/HabitProfileCard";
import { ChurnPreventionModal } from "@/components/ChurnPreventionModal";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useCommitments";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

const categoryIcons: Record<string, keyof typeof Feather.glyphMap> = {
  fitness: "activity",
  reading: "book",
  meditation: "sun",
  sobriety: "heart",
  learning: "book-open",
  creative: "edit-3",
};

const avatarPresets = [
  { id: "yoga", source: require("../assets/avatars/yoga.png") },
  { id: "mountain", source: require("../assets/avatars/mountain.png") },
  { id: "zen", source: require("../assets/avatars/zen.png") },
  { id: "running", source: require("../assets/avatars/running.png") },
  { id: "book", source: require("../assets/avatars/book.png") },
  { id: "creative", source: require("../assets/avatars/creative.png") },
];

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const { data: analytics } = useAnalytics();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showChurnModal, setShowChurnModal] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isEditing, setIsEditing] = useState(false);

  const totalCommitments = analytics?.totalCommitments || 0;
  const bestStreak = analytics?.bestStreak || 0;
  const activeCommitments = analytics?.activeCommitments || 0;
  const totalCheckIns = analytics?.totalCheckIns || 0;
  const categoryStats = analytics?.categoryStats || {};
  const weeklyData = analytics?.weeklyData || [];
  const maxWeeklyCount = Math.max(1, ...weeklyData.map((d) => d.count));

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
    setShowChurnModal(true);
  };

  const handleConfirmDelete = () => {
    setShowChurnModal(false);
    Alert.alert("Account Deletion", "Please contact support to delete your account.");
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
        {user?.plan === "pro" ? (
          <View style={[styles.proBadge, { backgroundColor: EarthyColors.gold }]}>
            <Feather name="star" size={12} color="#fff" />
            <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
          </View>
        ) : null}
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Your Habit Profile
      </ThemedText>
      <HabitProfileCard profileType={user?.habitProfileType ?? null} />

      <ThemedText type="h4" style={styles.sectionTitle}>
        Statistics
      </ThemedText>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${theme.primary}20` }]}>
            <Feather name="check-circle" size={24} color={theme.primary} />
          </View>
          <ThemedText style={styles.statValue}>{totalCheckIns}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Check-ins
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

      {weeklyData.length > 0 ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Weekly Activity
          </ThemedText>
          <Card style={styles.chartCard}>
            <View style={styles.barChart}>
              {weeklyData.map((day, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(day.count / maxWeeklyCount) * 100}%`,
                          backgroundColor: day.count > 0 ? theme.primary : theme.border,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.barLabel, { color: theme.textSecondary }]}>
                    {day.day}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : null}

      {Object.keys(categoryStats).length > 0 ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Categories
          </ThemedText>
          <View style={styles.categoryList}>
            {Object.entries(categoryStats).map(([category, stats]) => (
              <Card key={category} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: `${theme.primary}20` }]}>
                  <Feather
                    name={categoryIcons[category] || "target"}
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <ThemedText style={styles.categoryName}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </ThemedText>
                  <ThemedText style={[styles.categoryDetail, { color: theme.textSecondary }]}>
                    {stats.count} commitment{stats.count !== 1 ? "s" : ""}
                  </ThemedText>
                </View>
                <View style={styles.categoryStreak}>
                  <Feather name="trending-up" size={16} color={theme.secondary} />
                  <ThemedText style={[styles.streakText, { color: theme.secondary }]}>
                    {stats.streak}
                  </ThemedText>
                </View>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <ThemedText type="h4" style={styles.sectionTitle}>
        Settings
      </ThemedText>

      <Pressable
        style={[styles.menuItem, { borderColor: theme.border }]}
        onPress={() => navigation.navigate("NotificationSettings")}
      >
        <Feather name="bell" size={20} color={theme.text} />
        <ThemedText style={styles.menuItemText}>Notifications</ThemedText>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} style={styles.menuChevron} />
      </Pressable>

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

      <ChurnPreventionModal
        visible={showChurnModal}
        onClose={() => setShowChurnModal(false)}
        onConfirmDelete={handleConfirmDelete}
        streakCount={bestStreak}
        checkInsCount={totalCheckIns}
      />
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
  chartCard: {
    padding: Spacing.md,
  },
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 120,
    alignItems: "flex-end",
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  barWrapper: {
    flex: 1,
    width: "70%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    minHeight: 4,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  categoryList: {
    gap: Spacing.sm,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  categoryStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "700",
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
    flex: 1,
  },
  menuChevron: {
    marginLeft: "auto",
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
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
  },
  proBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
  },
});
