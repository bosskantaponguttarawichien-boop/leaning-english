import { getDatabase, ref, set, get, child, push, update, remove, onValue } from "firebase/database";
import { app } from "./firebase";

// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);

// === CRUD Operations for Realtime Database ===

/**
 * เขียนข้อมูลใหม่พร้อมสร้าง Key สุ่ม (เหมาะสำหรับการเพิ่ม List ของข้อมูล)
 * @param path ตำแหน่งใน Database เช่น "users"
 * @param data ข้อมูลที่จะเขียน
 */
export const pushData = async (path: string, data: any) => {
    try {
        const listRef = ref(db, path);
        const newRef = push(listRef);
        await set(newRef, data);
        return { success: true, key: newRef.key };
    } catch (error) {
        console.error("Error pushing data:", error);
        return { success: false, error };
    }
};

/**
 * เขียนทับ/กำหนดข้อมูลใน Path ที่ระบุชัดเจน (ถ้ามีอยู่แล้วจะถูกทับ)
 * @param path ตำแหน่งใน Database เช่น "settings/theme"
 * @param data ข้อมูลที่จะเขียน
 */
export const setData = async (path: string, data: any) => {
    try {
        await set(ref(db, path), data);
        return { success: true };
    } catch (error) {
        console.error("Error setting data:", error);
        return { success: false, error };
    }
};

/**
 * อ่านข้อมูลแบบครั้งเดียว (ดึงมารอบเดียว ไม่ได้ฟังการเปลี่ยนแปลงตลอดเวลา)
 * @param path ตำแหน่งใน Database เช่น "users/user1"
 */
export const readData = async (path: string) => {
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, path));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: true, data: null };
        }
    } catch (error) {
        console.error("Error reading data:", error);
        return { success: false, error };
    }
};

/**
 * อ่านข้อมูลแบบ Realtime (ฟังการเปลี่ยนแปลงตลอดเวลา)
 * @param path ตำแหน่งใน Database เช่น "users/user1"
 * @param callback ฟังก์ชันที่จะทำงานเมื่อข้อมูลมีการเปลี่ยนแปลง
 */
export const onDataChange = (path: string, callback: (data: any) => void) => {
    const dbRef = ref(db, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.exists() ? snapshot.val() : null;
        callback(data);
    });
    return unsubscribe;
};

/**
 * อัปเดตข้อมูลบางส่วน (ไม่เขียนทับทั้งหมด)
 * @param path ตำแหน่งใน Database หลัก เช่น "users/user1"
 * @param updates ข้อมูลที่ต้องการอัปเดตแบบระบุ Key เช่น { "age": 25, "status": "active" }
 */
export const updateData = async (path: string, updates: any) => {
    try {
        const itemRef = ref(db, path);
        await update(itemRef, updates);
        return { success: true };
    } catch (error) {
        console.error("Error updating data:", error);
        return { success: false, error };
    }
};

/**
 * ลบข้อมูล
 * @param path ตำแหน่งข้อมูลที่ต้องการลบ
 */
export const deleteData = async (path: string) => {
    try {
        await remove(ref(db, path));
        return { success: true };
    } catch (error) {
        console.error("Error deleting data:", error);
        return { success: false, error };
    }
};

// นำ db เปล่าๆ ออกไปเผื่อใช้งาน function อื่นๆ สดๆ ได้
export { db };
