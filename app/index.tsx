import { Image, ScrollView, View } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import DraggableGrid from "react-native-draggable-grid";
import * as Crypto from "expo-crypto";

export default function Index() {
  type ImageData = {
    key: string;
    uri: string;
    pinned: boolean;
    disabledDrag: boolean;
    disabledReSorted: boolean;
  };

  const scrollViewRef = useRef<ScrollView>(null);

  const [imageData, setImageData] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | undefined>(
    undefined
  );
  const [pinCount, setPinCount] = useState<number>(0);

  useEffect(() => {
    const getData = async () => {
      try {
        // await AsyncStorage.clear();
        const jsonValue = await AsyncStorage.getItem("imageData");
        if (jsonValue != null) setImageData(JSON.parse(jsonValue));
      } catch (error) {
        console.error(error);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    // update # of pins
    const pinCount = imageData.reduce((count, item) => {
      return item.pinned ? count + 1 : count;
    }, 0);
    setPinCount(pinCount);

    // set local storage
    const setAsyncStorage = async () => {
      try {
        await AsyncStorage.setItem("imageData", JSON.stringify(imageData));
      } catch (error) {
        console.error(error);
      }
    };
    setAsyncStorage();
  }, [imageData]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
      }}
    >
      <ScrollView ref={scrollViewRef}>
        <DraggableGrid
          numColumns={3}
          itemHeight={179}
          data={imageData}
          renderItem={(item) => {
            return (
              <View
                style={{
                  borderWidth: item.key === selectedImage?.key ? 4 : 1,
                  borderColor:
                    item.key === selectedImage?.key ? "#F2E94E" : "#ffffff",
                  minHeight: "100%",
                  minWidth: "100%",
                }}
              >
                {!!item.pinned && (
                  <Icon
                    name="pin"
                    size={32}
                    color="#FFFFFF"
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 0,
                      zIndex: 2,
                    }}
                  />
                )}
                <Image
                  key={item.key}
                  style={{
                    aspectRatio: "4/5",
                  }}
                  source={{ uri: item.uri }}
                />
              </View>
            );
          }}
          onDragStart={() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.setNativeProps({ scrollEnabled: false });
            }
          }}
          onDragRelease={async (data) => {
            if (scrollViewRef.current) {
              scrollViewRef.current.setNativeProps({ scrollEnabled: true });
            }

            setImageData(data);
          }}
          onItemPress={(imageData) => {
            setSelectedImage(
              selectedImage?.key === imageData.key ? undefined : imageData
            );
          }}
        />
      </ScrollView>
      <View
        style={{
          height: 90,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 -1px 4px rgba(0, 0, 0, 0.05)",
          padding: 10,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flex: 1, flexDirection: "row", gap: 80 }}>
          {!!selectedImage && (
            <Icon
              name="trash-outline"
              size={32}
              color="#000000"
              onPress={async () => {
                try {
                  const filteredImageData = imageData.filter(
                    (i) => i.key !== selectedImage.key
                  );

                  // store data
                  setSelectedImage(undefined);
                  setImageData(filteredImageData);
                } catch (error) {
                  console.error(error);
                }
              }}
            />
          )}
          {!!selectedImage && (
            <Icon
              name={selectedImage.pinned ? "pin" : "pin-outline"}
              size={32}
              color={
                !selectedImage.pinned && pinCount === 3 ? "#B0B3BF" : "#000000"
              }
              disabled={!selectedImage.pinned && pinCount === 3}
              onPress={async () => {
                try {
                  const copyImageData = [...imageData];

                  // change selected image pinned data
                  const selectedImageIndex = copyImageData.findIndex(
                    (i) => i.key === selectedImage.key
                  );
                  copyImageData[selectedImageIndex].pinned =
                    !selectedImage.pinned;
                  copyImageData[selectedImageIndex].disabledDrag =
                    !selectedImage.disabledDrag;
                  copyImageData[selectedImageIndex].disabledReSorted =
                    !selectedImage.disabledReSorted;

                  // move pins to the front
                  copyImageData.sort(
                    (x, y) =>
                      (y.pinned === true ? 1 : 0) - (x.pinned === true ? 1 : 0)
                  );
                  setImageData(copyImageData);
                } catch (error) {
                  console.error(error);
                }
              }}
            />
          )}
        </View>
        <Icon
          name="add"
          size={32}
          color="#000000"
          onPress={async () => {
            try {
              // select images
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsMultipleSelection: true,
              });

              // get uris of selected images
              let imageData: ImageData[] = [];
              if (!result.canceled)
                result.assets.forEach((i) =>
                  imageData.push({
                    uri: i.uri,
                    key: Crypto.randomUUID(),
                    pinned: false,
                    disabledDrag: false,
                    disabledReSorted: false,
                  })
                );

              // get existing uris
              const existingImageData = await AsyncStorage.getItem("imageData");
              if (existingImageData) {
                const parsedExistingImageData = JSON.parse(existingImageData);
                const pinnedImages = parsedExistingImageData.filter(
                  (i: ImageData) => i.pinned
                );
                const unpinnedImages = parsedExistingImageData.filter(
                  (i: ImageData) => !i.pinned
                );

                imageData = [...pinnedImages, ...imageData, ...unpinnedImages];
              }

              // store data
              setImageData(imageData);
            } catch (error) {
              console.error(error);
            }
          }}
        />
      </View>
    </View>
  );
}
