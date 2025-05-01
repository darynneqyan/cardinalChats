import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { auth, db, storage } from '@/config/firebase';
import Colors from '@/constants/Colors';
import { User } from '@/types';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    graduationYear: '',
    major: '',
    classes: '',
    industryExperience: '',
    activities: '',
    interests: '',
  });
  const router = useRouter();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    if (!auth.currentUser) {
      router.replace('/login');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          graduationYear: userData.graduationYear || '',
          major: userData.major || '',
          classes: (userData.classes || []).join(', '),
          industryExperience: (userData.industryExperience || []).join(', '),
          activities: (userData.activities || []).join(', '),
          interests: (userData.interests || []).join(', '),
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `profile-${auth.currentUser.uid}-${Date.now()}.jpg`;
      const storageRef = ref(storage, `profile-images/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        profilePictureUrl: imageUrl,
        updatedAt: new Date(),
      });

      setUser((prev) => prev ? { ...prev, profilePictureUrl: imageUrl } : null);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !user) return;

    try {
      setLoading(true);
      const userData = {
        name: formData.name,
        graduationYear: formData.graduationYear,
        major: formData.major,
        classes: formData.classes.split(',').map(c => c.trim()).filter(c => c),
        industryExperience: formData.industryExperience.split(',').map(i => i.trim()).filter(i => i),
        activities: formData.activities.split(',').map(a => a.trim()).filter(a => a),
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i),
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'users', auth.currentUser.uid), userData);
      setUser((prev) => prev ? { ...prev, ...userData } : null);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        <Image
          source={
            user?.profilePictureUrl
              ? { uri: user.profilePictureUrl }
              : require('@/assets/images/default-avatar.png')
          }
          style={styles.profileImage}
        />
        <Text style={styles.changePhotoText}>Change Photo</Text>
      </TouchableOpacity>

      {editing ? (
        <View style={styles.form}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Your full name"
          />

          <Text style={styles.label}>Graduation Year *</Text>
          <TextInput
            style={styles.input}
            value={formData.graduationYear}
            onChangeText={(text) => setFormData({ ...formData, graduationYear: text })}
            placeholder="Expected graduation year"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Major *</Text>
          <TextInput
            style={styles.input}
            value={formData.major}
            onChangeText={(text) => setFormData({ ...formData, major: text })}
            placeholder="Your major"
          />

          <Text style={styles.label}>Classes</Text>
          <TextInput
            style={styles.input}
            value={formData.classes}
            onChangeText={(text) => setFormData({ ...formData, classes: text })}
            placeholder="Current/Past classes (comma-separated)"
          />

          <Text style={styles.label}>Industry Experience</Text>
          <TextInput
            style={styles.input}
            value={formData.industryExperience}
            onChangeText={(text) => setFormData({ ...formData, industryExperience: text })}
            placeholder="Previous internships, jobs (comma-separated)"
          />

          <Text style={styles.label}>Activities</Text>
          <TextInput
            style={styles.input}
            value={formData.activities}
            onChangeText={(text) => setFormData({ ...formData, activities: text })}
            placeholder="Clubs, organizations (comma-separated)"
          />

          <Text style={styles.label}>Interests</Text>
          <TextInput
            style={styles.input}
            value={formData.interests}
            onChangeText={(text) => setFormData({ ...formData, interests: text })}
            placeholder="Hobbies, interests (comma-separated)"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setEditing(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.detail}>
            {user?.major} • Class of {user?.graduationYear}
          </Text>

          {user?.classes && user.classes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Classes</Text>
              <Text style={styles.sectionText}>{user.classes.join(', ')}</Text>
            </View>
          )}

          {user?.industryExperience && user.industryExperience.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Industry Experience</Text>
              <Text style={styles.sectionText}>
                {user.industryExperience.join(', ')}
              </Text>
            </View>
          )}

          {user?.activities && user.activities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activities</Text>
              <Text style={styles.sectionText}>{user.activities.join(', ')}</Text>
            </View>
          )}

          {user?.interests && user.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <Text style={styles.sectionText}>{user.interests.join(', ')}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => setEditing(true)}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  changePhotoText: {
    color: Colors.cardinal,
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  profileInfo: {
    width: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 4,
  },
  detail: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: Colors.gray[600],
    lineHeight: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  editButton: {
    backgroundColor: Colors.cardinal,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.cardinal,
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.gray[300],
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: Colors.gray[700],
    marginTop: 40,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 