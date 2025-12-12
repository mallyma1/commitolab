import React, { useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  useCommitments,
  useTodayCheckIns,
  useCreateCheckIn,
  Commitment,
} from "@/hooks/useCommitments";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import CommitmentCard from "@/components/CommitmentCard";
import { getGreeting, getCopy, getFocusAreaLabel } from "@/lib/tone-engine";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const { data: commitments, isLoading, refetch } = useCommitments();
  const { data: todayCheckIns } = useTodayCheckIns();
  const createCheckIn = useCreateCheckIn();

  const activeCommitments = useMemo(
    () => commitments?.filter((c) => c.active) || [],
    [commitments]
  );
  const copy = getCopy(user?.identityArchetype);
  const greeting = getGreeting(user?.displayName);
  const focusLabel = getFocusAreaLabel(user?.primaryGoalCategory);

  const todayCheckedInIds = useMemo(() => {
    return new Set(todayCheckIns?.map((c) => c.commitmentId) || []);
  }, [todayCheckIns]);

  const totalStreak = useMemo(() => {
    return activeCommitments.reduce((sum, c) => sum + c.currentStreak, 0);
  }, [activeCommitments]);

  const checkedInToday = useMemo(() => {
    return activeCommitments.filter((c) => todayCheckedInIds.has(c.id)).length;
  }, [activeCommitments, todayCheckedInIds]);

  const missedYesterday = useMemo(() => {
    return activeCommitments.some(
      (c) => c.currentStreak === 0 && c.longestStreak > 0
    );
  }, [activeCommitments]);

  const handleCreateNew = useCallback(() => {
    navigation.navigate("CommitmentWizard");
  }, [navigation]);

  const handleSelectCommitment = useCallback(
    (commitment: Commitment) => {
      navigation.navigate("CommitmentDetail", { commitment });
    },
    [navigation]
  );

  const handleQuickCheckIn = useCallback(
    async (commitmentId: string) => {
      try {
        await createCheckIn.mutateAsync({ commitmentId });
      } catch (error) {
        console.error("Check-in failed:", error);
      }
    },
    [createCheckIn]
  );

  const renderHeroBlock = () => (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={styles.heroContainer}
    >
      <Card style={styles.heroCard}>
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <ThemedText type="h3" style={styles.greeting}>
              {greeting}
            </ThemedText>
            <ThemedText
              style={[styles.focusText, { color: theme.textSecondary }]}
            >
              Building: {focusLabel}
            </ThemedText>
          </View>
          <View
            style={[
              styles.streamlinedIcon,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <Feather name="target" size={24} color={theme.primary} />
          </View>
        </View>

        <View
          style={[
            styles.metricsRow,
            { borderTopColor: theme.border, borderBottomColor: theme.border },
          ]}
        >
          <View style={styles.metricCard}>
            <ThemedText style={[styles.metricValue, { color: theme.primary }]}>
              {totalStreak}
            </ThemedText>
            <ThemedText
              style={[styles.metricLabel, { color: theme.textSecondary }]}
            >
              streak days
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.metricCard}>
            <ThemedText style={[styles.metricValue, { color: theme.success }]}>
              {checkedInToday}/{activeCommitments.length}
            </ThemedText>
            <ThemedText
              style={[styles.metricLabel, { color: theme.textSecondary }]}
            >
              checked in
            </ThemedText>
          </View>
        </View>

        {missedYesterday ? (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: `${theme.warning}15`,
                borderColor: `${theme.warning}30`,
              },
            ]}
          >
            <Feather
              name="alert-circle"
              size={16}
              color={theme.warning}
              style={{ marginRight: 8 }}
            />
            <ThemedText style={[{ color: theme.warning }]}>
              {copy.missedDay}
            </ThemedText>
          </View>
        ) : totalStreak > 0 ? (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: `${theme.success}15`,
                borderColor: `${theme.success}30`,
              },
            ]}
          >
            <Feather
              name="check-circle"
              size={16}
              color={theme.success}
              style={{ marginRight: 8 }}
            />
            <ThemedText style={[{ color: theme.success }]}>
              {copy.streakGoing}
            </ThemedText>
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );

  const renderSectionHeader = () => (
    <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
      <Feather name="check-square" size={18} color={theme.primary} />
      <ThemedText type="h4" style={{ flex: 1, marginLeft: Spacing.sm }}>
        Today's Commitments
      </ThemedText>
      {checkedInToday === activeCommitments.length &&
      activeCommitments.length > 0 ? (
        <View
          style={[
            styles.completedBadge,
            { backgroundColor: `${theme.success}20` },
          ]}
        >
          <Feather name="check" size={12} color={theme.success} />
          <ThemedText
            style={[
              styles.completedText,
              { color: theme.success, marginLeft: 4 },
            ]}
          >
            Perfect
          </ThemedText>
        </View>
      ) : null}
    </View>
  );

  const renderEmptyState = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyContainer}>
      <View
        style={[styles.emptyIcon, { backgroundColor: `${theme.primary}15` }]}
      >
        <Feather name="plus-circle" size={56} color={theme.primary} />
      </View>
      <ThemedText
        type="h4"
        style={[styles.emptyTitle, { marginTop: Spacing.lg }]}
      >
        No Commitments Yet
      </ThemedText>
      <ThemedText
        style={[
          styles.emptyText,
          { color: theme.textSecondary, marginTop: Spacing.md },
        ]}
      >
        Start by creating your first commitment. Pick something you want to
        build daily.
      </ThemedText>
      <Pressable
        style={[
          styles.emptyButton,
          { backgroundColor: theme.primary, marginTop: Spacing.lg },
        ]}
        onPress={handleCreateNew}
      >
        <Feather name="plus" size={18} color="#fff" />
        <ThemedText style={styles.emptyButtonText}>
          Create First Commitment
        </ThemedText>
      </Pressable>
    </Animated.View>
  );

  const renderItem = ({ item, index }: { item: Commitment; index: number }) => {
    const isCheckedIn = todayCheckedInIds.has(item.id);
    return (
      <Animated.View entering={FadeInUp.delay(100 * index).duration(300)}>
        <CommitmentCard
          commitment={item}
          onPress={() => handleSelectCommitment(item)}
          isCheckedInToday={isCheckedIn}
          onQuickCheckIn={() => handleQuickCheckIn(item.id)}
          isCheckingIn={createCheckIn.isPending}
        />
      </Animated.View>
    );
  };

  const ListHeader = () => (
    <>
      {renderHeroBlock()}
      {activeCommitments.length > 0 ? renderSectionHeader() : null}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
          flexGrow: activeCommitments.length === 0 ? 1 : undefined,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={activeCommitments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />

      <Pressable
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: tabBarHeight + Spacing.xl,
          },
        ]}
        onPress={handleCreateNew}
      >
        <Feather name="plus" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    marginBottom: Spacing.lg,
  },
  heroCard: {
    padding: Spacing.lg,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  focusText: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  streamlinedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  metricCard: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 40,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  completedText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: Spacing.md,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
