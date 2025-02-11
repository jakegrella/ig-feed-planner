import * as FileSystem from "expo-file-system";

export default async function clearCache() {
    try {
        const cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) return;
        const files = await FileSystem.readDirectoryAsync(cacheDir);

        for (const file of files) {
            await FileSystem.deleteAsync(`${cacheDir}${file}`);
        }
        console.log("successfully cleared cache");
    } catch (error) {
        console.error("error clearing cache", error);
    }
};