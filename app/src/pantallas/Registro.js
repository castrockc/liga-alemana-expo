import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../firebase/config";

export default function RegistroScreen({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  const registrarUsuario = async () => {
    const nombreFinal = nombre.trim();
    const correoFinal = correo.trim().toLowerCase();

    if (!nombreFinal || !correoFinal || !contrasena) {
      Alert.alert("Atención", "Completa todos los campos.");
      return;
    }

    if (contrasena.length < 6) {
      Alert.alert(
        "Contraseña",
        "Debe tener al menos 6 caracteres."
      );
      return;
    }

    setCargando(true);

    try {
      // Crear usuario en Firebase Authentication
      const resultado = await createUserWithEmailAndPassword(
        auth,
        correoFinal,
        contrasena
      );

      // Guardar el nombre del usuario
      await updateProfile(resultado.user, {
        displayName: nombreFinal,
      });

      // Crear el perfil en Cloud Firestore
      await setDoc(doc(db, "usuarios", resultado.user.uid), {
        nombre: nombreFinal,
        correo: correoFinal,
        fechaRegistro: serverTimestamp(),
      });

      Alert.alert(
        "Registro exitoso",
        "¡Bienvenido a Liga Alemana!"
      );
    } catch (error) {
      console.log(error);

      let mensaje = "Ocurrió un error al registrarte.";

      if (error.code === "auth/email-already-in-use") {
        mensaje = "Este correo ya está registrado.";
      } else if (error.code === "auth/invalid-email") {
        mensaje = "El correo no es válido.";
      } else if (error.code === "auth/weak-password") {
        mensaje = "La contraseña es demasiado débil.";
      } else if (error.code === "permission-denied") {
        mensaje = "No se pudo guardar el perfil en Firestore.";
      }

      Alert.alert("Aviso", mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.logo}>⚽</Text>

      <Text style={styles.titulo}>LIGA ALEMANA</Text>

      <Text style={styles.subtitulo}>
        Crea tu cuenta para vivir la Bundesliga
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        placeholderTextColor="#999"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={correo}
        onChangeText={setCorreo}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />

      <Pressable
        style={styles.boton}
        onPress={registrarUsuario}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.textoBoton}>
            CREAR CUENTA
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.enlace}>
          ¿Ya tienes cuenta? Inicia sesión
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#101010",
    justifyContent: "center",
    padding: 25,
  },
  logo: {
    fontSize: 65,
    textAlign: "center",
    marginBottom: 10,
  },
  titulo: {
    color: "#FFD700",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitulo: {
    color: "#ccc",
    textAlign: "center",
    marginBottom: 35,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#444",
  },
  boton: {
    backgroundColor: "#D71920",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  textoBoton: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  enlace: {
    color: "#FFD700",
    textAlign: "center",
    marginTop: 25,
  },
});