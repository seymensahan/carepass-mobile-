import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { storage } from "../../lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ONBOARDING_KEY = "carepass_onboarding_done";

interface Slide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: "1",
    icon: "shield",
    iconColor: "#007bff",
    iconBg: "#007bff15",
    title: "Votre carnet de santé\nnumérique",
    description:
      "Centralisez vos consultations, résultats d'analyses, vaccinations et ordonnances dans un seul endroit sécurisé.",
  },
  {
    id: "2",
    icon: "lock",
    iconColor: "#28a745",
    iconBg: "#28a74515",
    title: "Vous contrôlez\nvos données",
    description:
      "Décidez quels médecins accèdent à votre dossier, pour combien de temps, et révoquez l'accès à tout moment.",
  },
  {
    id: "3",
    icon: "alert-circle",
    iconColor: "#dc3545",
    iconBg: "#dc354515",
    title: "Accès d'urgence\nintelligent",
    description:
      "En cas d'urgence, un QR Code permet aux soignants d'accéder à vos informations vitales — groupe sanguin, allergies, traitements.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  }

  function handleSkip() {
    completeOnboarding();
  }

  function completeOnboarding() {
    storage.set(ONBOARDING_KEY, "true");
    router.replace("/(auth)/welcome");
  }

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={{ width: SCREEN_WIDTH }} className="items-center justify-center px-10">
      <View
        className="w-28 h-28 rounded-3xl items-center justify-center mb-10"
        style={{ backgroundColor: item.iconBg }}
      >
        <Feather name={item.icon} size={52} color={item.iconColor} />
      </View>
      <Text className="text-2xl font-bold text-foreground text-center leading-9 mb-4">
        {item.title}
      </Text>
      <Text className="text-base text-muted text-center leading-6">
        {item.description}
      </Text>
    </View>
  );

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-background">
      {/* Skip button */}
      <View className="flex-row justify-end px-6 pt-14">
        {!isLast && (
          <Pressable
            onPress={handleSkip}
            className="py-2 px-4"
            accessibilityLabel="Passer l'introduction"
          >
            <Text className="text-sm font-medium text-muted">Passer</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <View className="flex-1 justify-center">
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>

      {/* Bottom section */}
      <View className="px-6 pb-12">
        {/* Dots */}
        <View className="flex-row items-center justify-center mb-8">
          {SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * SCREEN_WIDTH,
              i * SCREEN_WIDTH,
              (i + 1) * SCREEN_WIDTH,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={{
                  width: dotWidth,
                  opacity: dotOpacity,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#007bff",
                  marginHorizontal: 4,
                }}
              />
            );
          })}
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={handleNext}
          className="bg-primary h-14 rounded-xl items-center justify-center flex-row active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel={isLast ? "Commencer" : "Suivant"}
        >
          <Text className="text-base font-semibold text-white mr-2">
            {isLast ? "Commencer" : "Suivant"}
          </Text>
          <Feather
            name={isLast ? "check" : "arrow-right"}
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>
    </View>
  );
}
