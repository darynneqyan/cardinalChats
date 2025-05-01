import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { auth, db, storage } from '@/config/firebase';
import Colors from '@/constants/Colors';

export default function CompleteProfileScreen() {
  const [name, setName] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [major, setMajor] = useState('');
  const [classes, setClasses] = useState('');
  const [industryExperience, setIndustryExperience] = useState('');
  const [activities, setActivities] = useState('');
  const [interests, setInterests] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!auth.currentUser) return null;

    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `profile-${auth.currentUser.uid}-${Date.now()}.jpg`;
    const storageRef = ref(storage, `profile-images/${filename}`);
    
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const handleComplete = async () => {
    try {
      if (!auth.currentUser) return;
      setLoading(true);

      if (!name || !graduationYear || !major) {
        setError('Name, graduation year, and major are required');
        setLoading(false);
        return;
      }

      const userData: any = {
        name,
        graduationYear,
        major,
        classes: classes.split(',').map(c => c.trim()).filter(c => c),
        industryExperience: industryExperience.split(',').map(i => i.trim()).filter(i => i),
        activities: activities.split(',').map(a => a.trim()).filter(a => a),
        interests: interests.split(',').map(i => i.trim()).filter(i => i),
        updatedAt: new Date(),
      };

      if (profileImage) {
        const imageUrl = await uploadImage(profileImage);
        if (imageUrl) {
          userData.profilePictureUrl = imageUrl;
        }
      }

      await updateDoc(doc(db, 'users', auth.currentUser.uid), userData);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Help others get to know you better</Text>

      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your full name"
        />

        <Text style={styles.label}>Graduation Year *</Text>
        <TextInput
          style={styles.input}
          value={graduationYear}
          onChangeText={setGraduationYear}
          placeholder="Expected graduation year"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Major *</Text>
        <TextInput
          style={styles.input}
          value={major}
          onChangeText={setMajor}
          placeholder="Your major"
        />

        <Text style={styles.label}>Classes</Text>
        <TextInput
          style={styles.input}
          value={classes}
          onChangeText={setClasses}
          placeholder="Current/Past classes (comma-separated)"
        />

        <Text style={styles.label}>Industry Experience</Text>
        <TextInput
          style={styles.input}
          value={industryExperience}
          onChangeText={setIndustryExperience}
          placeholder="Previous internships, jobs (comma-separated)"
        />

        <Text style={styles.label}>Activities</Text>
        <TextInput
          style={styles.input}
          value={activities}
          onChangeText={setActivities}
          placeholder="Clubs, organizations (comma-separated)"
        />

        <Text style={styles.label}>Interests</Text>
        <TextInput
          style={styles.input}
          value={interests}
          onChangeText={setInterests}
          placeholder="Hobbies, interests (comma-separated)"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Complete Profile'}
        </Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.cardinal,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray[600],
    marginBottom: 30,
    textAlign: 'center',
  },
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: Colors.gray[600],
    fontSize: 16,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
  button: {
    backgroundColor: Colors.cardinal,
    padding: 15,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  error: {
    color: Colors.cardinal,
    marginBottom: 10,
    textAlign: 'center',
  },
}); 