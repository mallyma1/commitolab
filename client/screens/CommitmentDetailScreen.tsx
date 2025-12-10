import React from "react";
import { View, StyleSheet, FlatList, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useCheckIns, CheckIn, Commitment } from "@/hooks/useCommitments";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DetailRouteProp = RouteProp<RootStackParamList, "CommitmentDetail">;

const { width: screenWidth } = Dimensions.get("window");
const PHOTO_SIZE = (screenWidth - Spacing.lg * 2 - Spacing.sm * 2) / 3;

const categoryIcons: Record<string, keyof typeof Feather.glyphMap> = {
  fitness: "activity",
  reading: "book",
  meditation: "sun",
  sobriety: "heart",
  learning: "book-open",
  creative: "edit-3",
};

export default function CommitmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { commitment } = route.params;
  const { data: checkIns = [], isLoading } = useCheckIns(commitment.id);
  const baseUrl = getApiUrl();

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(commitment.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getPhotoUrl = (mediaUrl: string | null): string | null => {
    if (!mediaUrl) return null;
    if (mediaUrl.startsWith("http")) return mediaUrl;
    return new URL(`/objects${mediaUrl}`, baseUrl).toString();
  };

  const renderCheckIn = ({ item }: { item: CheckIn }) => {
    const photoUrl = getPhotoUrl(item.mediaUrl);

    return (
      <Card style={styles.checkInCard}>
        <View style={styles.checkInHeader}>
          <Feather name="check-circle" size={20} color={theme.secondary} />
          <ThemedText style={styles.checkInDate}>{formatDate(item.createdAt)}</ThemedText>
        </View>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.checkInPhoto}
            contentFit="cover"
          />
        ) : null}
        {item.note ? (
          <ThemedText style={[styles.checkInNote, { color: theme.textSecondary }]}>
            {item.note}
          </ThemedText>
        ) : null}
      </Card>
    );
  };

  const photosOnly = checkIns.filter((c) => c.mediaUrl);

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={checkIns}
        keyExtractor={(item) => item.id}
        renderItem={renderCheckIn}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
              <Feather
                name={categoryIcons[commitment.category] || "target"}
                size={32}
                color={theme.primary}
              />
            </View>
            <ThemedText style={styles.title}>{commitment.title}</ThemedText>
            <ThemedText style={[styles.category, { color: theme.textSecondary }]}>
              {commitment.category.charAt(0).toUpperCase() + commitment.category.slice(1)} •{" "}
              {commitment.cadence}
            </ThemedText>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                  {commitment.currentStreak}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Current Streak
                </ThemedText>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText style={[styles.statValue, { color: theme.accent }]}>
                  {commitment.longestStreak}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Best Streak
                </ThemedText>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText style={[styles.statValue, { color: theme.secondary }]}>
                  {daysRemaining}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Days Left
                </ThemedText>
              </View>
            </View>

            {photosOnly.length > 0 ? (
              <View style={styles.gallerySection}>
                <ThemedText style={styles.sectionTitle}>Photo Gallery</ThemedText>
                <View style={styles.photoGrid}>
                  {photosOnly.slice(0, 6).map((checkIn) => {
                    const photoUrl = getPhotoUrl(checkIn.mediaUrl);
                    return photoUrl ? (
                      <Image
                        key={checkIn.id}
                        source={{ uri: photoUrl }}
                        style={[styles.gridPhoto, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}
                        contentFit="cover"
                      />
                    ) : null;
                  })}
                </View>
                {photosOnly.length > 6 ? (
                  <ThemedText style={[styles.morePhotos, { color: theme.textSecondary }]}>
                    +{photosOnly.length - 6} more photos
                  </ThemedText>
                ) : null}
              </View>
            ) : null}

            <ThemedText style={styles.sectionTitle}>Check-in History</ThemedText>
            {checkIns.length === 0 && !isLoading ? (
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No check-ins yet. Start your streak today!
              </ThemedText>
            ) : null}
          </View>
        }
        ListFooterComponent={<View style={{ height: Spacing.xl }} />}
      />

      <View style={[styles.footer, { backgroundColor: theme.backgroundRoot }]}>
        <Button
          onPress={() => navigation.navigate("CheckIn", { commitment })}
          style={styles.checkInButton}
        >
          <Feather name="camera" size={20} color="#fff" style={{ marginRight: Spacing.sm }} />
          Check In Now
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  category: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  gallerySection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  gridPhoto: {
    borderRadius: BorderRadius.sm,
  },
  morePhotos: {
    fontSize: 12,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  checkInCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  checkInHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkInDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  checkInPhoto: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  checkInNote: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  checkInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
