//const SUPABASE_URL = 'https://izeyhkndfmvjrzefmcwo.supabase.co'; // ใส่ URL จาก Supabase
//const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZXloa25kZm12anJ6ZWZtY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODAyOTAsImV4cCI6MjA4MDc1NjI5MH0.pktZNYnFeRzTez08cEKQJL3dPNVZslfSVxVzq7XzdjI'; // ใส่ anon key จาก Supabase


// Supabase Configuration
// ถ้าไม่มี Supabase หรือไม่ต้องการใช้ database ให้เปลี่ยน USE_SUPABASE เป็น false
const USE_SUPABASE = false; // เปลี่ยนเป็น true เมื่อพร้อมใช้ Supabase

// ใส่ข้อมูลจาก Supabase ของคุณตรงนี้
const SUPABASE_URL = 'https://izeyhkndfmvjrzefmcwo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZXloa25kZm12anJ6ZWZtY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODAyOTAsImV4cCI6MjA4MDc1NjI5MH0.pktZNYnFeRzTez08cEKQJL3dPNVZslfSVxVzq7XzdjI';

// Initialize Supabase (ถ้าเปิดใช้งาน)
let supabase = null;

if (USE_SUPABASE && typeof window.supabase !== 'undefined') {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase connected successfully');
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
        supabase = null;
    }
} else {
    console.log('ℹ️ Running in demo mode (no database)');
}