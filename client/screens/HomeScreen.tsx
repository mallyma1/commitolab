import React, { useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Image, Pressable } from "react-native";
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
import { useCommitments, useTodayCheckIns, useCreateCheckIn, Commitment, CheckIn } from "@/hooks/useCommitments";
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

  const activeCommitments = commitments?.filter((c) => c.active) || [];
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
    return activeCommitments.some((c) => c.currentStreak === 0 && c.longestStreak > 0);
  }, [activeCommitments]);

  const handleCreateNew = useCallback(() => {
    navigation.navigate("CommitmentWizard");
  }, [navigation]);

  const handleOpenStoicRoom = useCallback(() => {
    navigation.navigate("StoicRoom");
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
    <Animated.View entering={FadeInDown.duration(400)} style={styles.heroContainer}>
      <Card style={styles.heroCard}>
        <ThemedText type="h3" style={styles.greeting}>
          {greeting}
        </ThemedText>
        <ThemedText style={[styles.focusText, { color: theme.textSecondary }]}>
          You are building: {focusLabel}
        </ThemedText>
        
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <View style={[styles.heroStatIcon, { backgroundColor: `${theme.primary}20` }]}>
              <Feather name="zap" size={20} color={theme.primary} />
            </View>
            <View>
              <ThemedText style={styles.heroStatValue}>{totalStreak}</ThemedText>
              <ThemedText style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                total streak days
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.heroStat}>
            <View style={[styles.heroStatIcon, { backgroundColor: `${theme.success}20` }]}>
              <Feather name="check-circle" size={20} color={theme.success} />
            </View>
            <View>
              <ThemedText style={styles.heroStatValue}>
                {checkedInToday}/{activeCommitments.length}
              </ThemedText>
              <ThemedText style={[styles.heroStatLabel, { color: theme.textSecondary }]}>
                done today
              </ThemedText>
            </View>
          </View>
        </View>

        {missedYesterday ? (
          <View style={[styles.missedBanner, { backgroundColor: `${theme.warning}15` }]}>
            <Feather name="alert-circle" size={16} color={theme.warning} />
            <ThemedText style={[styles.missedText, { color: theme.warning }]}>
              {copy.missedDay}
            </ThemedText>
          </View>
        ) : totalStreak > 0 ? (
          <View style={[styles.motivationBanner, { backgroundColor: `${theme.primary}10` }]}>
            <Feather name="trending-up" size={16} color={theme.primary} />
            <ThemedText style={[styles.motivationText, { color: theme.primary }]}>
              {copy.streakGoing}
            </ThemedText>
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );

  const renderSectionHeader = () => (
    <View style={styles.sectionHeader}>
      <ThemedText type="h4">Today's Commitments</ThemedText>
      {checkedInToday === activeCommitments.length && activeCommitments.length > 0 ? (
        <View style={[styles.completedBadge, { backgroundColor: `${theme.success}20` }]}>
          <Feather name="check" size={14} color={theme.success} />
          <ThemedText style={[styles.completedText, { color: theme.success }]}>
            All done
          </ThemedText>
        </View>
      ) : null}
    </View>
  );

  const renderEmptyState = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}15` }]}>
        <Feather name="target" size={48} color={theme.primary} />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>
        No Commitments Yet
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        {copy.noStreak} Create your first commitment and begin building the version of you that shows up.
      </ThemedText>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: theme.primary }]}
        onPress={handleCreateNew}
      >
        <Feather name="plus" size={20} color="#fff" />
        <ThemedText style={styles.emptyButtonText}>Create Your First</ThemedText>
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
  heroStats: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  heroStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  heroStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  heroStatLabel: {
    fontSize: 12,
  },
  missedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  missedText: {
    fontSize: 13,
    flex: 1,
  },
  motivationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  motivationText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
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
