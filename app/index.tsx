import {
  Button,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import DraggableGrid from "react-native-draggable-grid";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";
import clearCache from "./utils/clearCache";
import deleteAllContent from "./utils/deleteAllContent";
import { SafeAreaView } from "react-native-safe-area-context";

const getDirectoryContents = async () => {
  try {
    const dirContents = await FileSystem.readDirectoryAsync(
      FileSystem.documentDirectory + "images"
    );
    console.log(".../documents/images contents:", dirContents);
    return dirContents;
  } catch (error) {
    console.error("error fetching directory contents", error);
  }
};

// const addOldDirItem = async () => {
//   try {
//     const imageDataString = await AsyncStorage.getItem("imageData");
//     if (imageDataString === null) return;
//     const imageDataJSON = JSON.parse(imageDataString);

//     await AsyncStorage.setItem(
//       "imageData",
//       JSON.stringify([
//         ...imageDataJSON,
//         {
//           key: Crypto.randomUUID(),
//           uri: "file://Library/Caches/test",
//           pinned: false,
//           disabledDrage: false,
//           disabledReSorted: false,
//         },
//       ])
//     );
//   } catch (error) {
//     console.error(error);
//   }
// };

const deleteDirectoryItem = async (filename: string) => {
  try {
    await FileSystem.deleteAsync(
      FileSystem.documentDirectory + "images/" + filename
    );
    console.log("successfully deleted directory item");
  } catch (error) {
    console.error("error deleting directory item", error);
  }
};

const storeImage = async (cacheUri: string, desiredUri: string) => {
  try {
    // make directory if doesn't exist
    await FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + "images/",
      { intermediates: true }
    );
    // copy image to app's documents
    await FileSystem.copyAsync({ from: cacheUri, to: desiredUri });
  } catch (error) {
    console.error("failed to add file to dir", error);
  }
};

const handleMigration = async (data: any[]) => {
  data.forEach(async (i) => {
    // add caption field if missing
    if ("caption" in i === false) i.caption = "";

    // add filename field if missing
    if ("filename" in i === false) {
      const id = Crypto.randomUUID();
      i.filename = `${id}.jpg`; // hope it's a jpg
    }

    // migrate file from cached to app dir
    if (i.uri.includes("Library/Caches")) {
      await storeImage(
        i.uri,
        `${FileSystem.documentDirectory}images/${i.filename}`
      );
    }

    // delete uri
    if ("uri" in i) delete i.uri;
  });
};

type ImageData = {
  key: string;
  filename: string;
  caption: string;
  pinned: boolean;
  disabledDrag: boolean;
  disabledReSorted: boolean;
};

export default function Index() {
  const isDevEnv = process.env.NODE_ENV === "development";
  const colorScheme = useColorScheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [imageData, setImageData] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | undefined>(
    undefined
  );
  const [pinCount, setPinCount] = useState<number>(0);
  const [editCaptionActive, setEditCaptionActive] = useState<boolean>(false);
  const [captionText, setCaptionText] = useState<string>("");

  useEffect(() => {
    const getData = async () => {
      try {
        // await addOldDirItem();

        const jsonValue = await AsyncStorage.getItem("imageData");
        if (jsonValue != null) {
          const data = JSON.parse(jsonValue);
          // console.log(
          //   "getData imageData(jsonValue)",
          //   JSON.stringify(data, null, 2)
          // );

          await handleMigration(data);

          setImageData(data);
        }
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
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colorScheme === "light" ? "#ffffff" : "#000000",
        borderWidth: isDevEnv ? 2 : NaN,
        borderColor: isDevEnv ? "red" : "",
      }}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{
          borderWidth: isDevEnv ? 2 : NaN,
          borderColor: isDevEnv ? "yellow" : "",
        }}
      >
        <DraggableGrid
          numColumns={3}
          itemHeight={Dimensions.get("window").width / 3 / (0.75 / 1)} // row width / aspect ratio
          data={imageData}
          renderItem={(item) => {
            return (
              <View
                style={{
                  borderWidth: item.key === selectedImage?.key ? 4 : 1,
                  borderColor:
                    item.key === selectedImage?.key
                      ? "#f2e94e"
                      : colorScheme === "light"
                      ? "#ffffff"
                      : "#000000",
                  minHeight: "100%",
                  minWidth: "100%",
                }}
              >
                {!!item.pinned && (
                  <Icon
                    name="pin"
                    size={32}
                    color="#ffffff"
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
                    flex: 1,
                    resizeMode: "cover",
                  }}
                  source={{
                    uri: `${FileSystem.documentDirectory}images/${item.filename}`,
                  }}
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
            if (!editCaptionActive) {
              setSelectedImage(
                selectedImage?.key === imageData.key ? undefined : imageData
              );
            }
          }}
        />
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          borderWidth: isDevEnv ? 2 : NaN,
          borderColor: isDevEnv ? "blue" : "",
        }}
      >
        {isDevEnv && (
          <View
            style={{
              height: 60,
              backgroundColor: colorScheme === "light" ? "#ebebeb" : "#141414",
              padding: 10,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            <Button
              onPress={async () => {
                await clearCache();
                await deleteAllContent();
              }}
              title="clr"
            />
            <Button
              onPress={async () => {
                await getDirectoryContents();
              }}
              title="log"
            />
          </View>
        )}
        {!!selectedImage && !!editCaptionActive && (
          <View>
            <TextInput
              placeholder="Add a caption..."
              value={captionText}
              onChangeText={(e) => {
                setCaptionText(e);
              }}
              multiline
              style={{
                color: colorScheme === "light" ? "black" : "white",
                padding: 8,
                height: 200,
              }}
            />
            <View style={{ display: "flex", flexDirection: "row" }}>
              <TouchableOpacity
                style={{
                  width: "25%",
                  backgroundColor: "#FF7083",
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  setCaptionText(selectedImage.caption);
                  setEditCaptionActive(false);
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: 700 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: "75%",
                  backgroundColor: "#CFF27E",
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  const copyImageData = [...imageData];

                  // change selected image pinned data
                  const selectedImageIndex = copyImageData.findIndex(
                    (i) => i.key === selectedImage.key
                  );
                  copyImageData[selectedImageIndex].caption = captionText;
                  setImageData(copyImageData);
                  setCaptionText(copyImageData[selectedImageIndex].caption);
                  setEditCaptionActive(false);
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: 700 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View
          style={{
            backgroundColor: colorScheme === "light" ? "#ffffff" : "#000000",
            boxShadow: "0 -1px 4px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 10,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", gap: 50 }}>
            {!!selectedImage && (
              <React.Fragment>
                <Icon
                  name="trash-outline"
                  size={32}
                  disabled={editCaptionActive}
                  color={
                    editCaptionActive
                      ? "#b0b3bf"
                      : colorScheme === "light"
                      ? "#000000"
                      : "#ffffff"
                  }
                  onPress={async () => {
                    try {
                      const filteredImageData = imageData.filter(
                        (i) => i.key !== selectedImage.key
                      );

                      // delete file from documents
                      await deleteDirectoryItem(selectedImage.filename);

                      // remove image and update AsyncStorage
                      setSelectedImage(undefined);
                      setImageData(filteredImageData);
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                />
                <Icon
                  name={selectedImage.pinned ? "pin" : "pin-outline"}
                  size={32}
                  color={
                    !selectedImage.pinned && pinCount === 3
                      ? "#b0b3bf"
                      : colorScheme === "light"
                      ? "#000000"
                      : "#ffffff"
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
                          (y.pinned === true ? 1 : 0) -
                          (x.pinned === true ? 1 : 0)
                      );
                      setImageData(copyImageData);
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                />
                <Icon
                  name={
                    editCaptionActive
                      ? "chatbubble-ellipses"
                      : "chatbubble-ellipses-outline"
                  }
                  disabled={editCaptionActive}
                  size={32}
                  color={colorScheme === "light" ? "#000000" : "#ffffff"}
                  onPress={() => {
                    if (!editCaptionActive) {
                      setEditCaptionActive(true);
                      setCaptionText(selectedImage.caption);
                    }
                  }}
                />
              </React.Fragment>
            )}
          </View>
          <Icon
            name="add"
            size={32}
            color={
              editCaptionActive
                ? "#b0b3bf"
                : colorScheme === "light"
                ? "#000000"
                : "#ffffff"
            }
            disabled={editCaptionActive}
            onPress={async () => {
              if (editCaptionActive) return;
              try {
                // select images
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ["images"],
                  allowsMultipleSelection: true,
                });

                if (result.canceled) return;

                // get uris of selected images
                const newImageData = await Promise.all(
                  result.assets.map(async (i) => {
                    // generate unique id for image
                    const id = Crypto.randomUUID();
                    const filename = `${id}-${
                      i.fileName || i.mimeType || ".jpg"
                    }`;
                    const newUri = `${FileSystem.documentDirectory}images/${filename}`;
                    try {
                      await storeImage(i.uri, newUri);
                    } catch (error) {
                      console.error(error);
                    }

                    return {
                      key: id,
                      uri: newUri,
                      filename,
                      caption: "",
                      pinned: false,
                      disabledDrag: false,
                      disabledReSorted: false,
                    };
                  })
                );

                // get existing image data
                const existingImageData = await AsyncStorage.getItem(
                  "imageData"
                );
                let combinedImageData = newImageData;

                if (existingImageData) {
                  const parsedExistingImageData = JSON.parse(existingImageData);
                  const pinnedImages = parsedExistingImageData.filter(
                    (i: ImageData) => i.pinned
                  );
                  const unpinnedImages = parsedExistingImageData.filter(
                    (i: ImageData) => !i.pinned
                  );

                  combinedImageData = [
                    ...pinnedImages,
                    ...newImageData,
                    ...unpinnedImages,
                  ];
                }

                // update state and storage
                setImageData(combinedImageData);
              } catch (error) {
                console.error(error);
              }
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
