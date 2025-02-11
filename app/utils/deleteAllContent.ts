import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";


export default async function deleteAllContent() {
    try {
        await AsyncStorage.removeItem('imageData')
        await FileSystem.deleteAsync(FileSystem.documentDirectory + 'images', {
            idempotent: true
        })

        console.log('data successfully deleted');
    } catch (error) {
        console.error('error deleting data', error)
    }
}