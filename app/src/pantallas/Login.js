import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

// Firebase Authentication
import { signInWithEmailAndPassword } from "firebase/auth";

// Configuración de Firebase
import { auth } from "../../firebase/config";

export default function Login({ navigation }) {

  // Estados del formulario
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Iniciar sesión con Firebase
  const iniciarSesion = async () => {

    const correoFinal = correo.trim().toLowerCase();

    if (!correoFinal || !contrasena) {
      setMensaje("Debes completar todos los campos.");
      return;
    }

    setCargando(true);
    setMensaje("");

    try {

      await signInWithEmailAndPassword(
        auth,
        correoFinal,
        contrasena
      );

      // App.js detectará automáticamente
      // que el usuario inició sesión.

    } catch (error) {

      console.log("Error de inicio de sesión:", error.code);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setMensaje("Correo o contraseña incorrectos.");

      } else if (error.code === "auth/invalid-email") {
        setMensaje("El correo electrónico no es válido.");

      } else if (error.code === "auth/too-many-requests") {
        setMensaje("Demasiados intentos. Intenta más tarde.");

      } else if (error.code === "auth/network-request-failed") {
        setMensaje("Comprueba tu conexión a Internet.");

      } else {
        setMensaje("No se pudo iniciar sesión.");
      }

    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.contenedor}>

      <Text style={styles.logo}>⚽</Text>

      <Text style={styles.titulo}>
        LIGA ALEMANA
      </Text>

      <Text style={styles.subtitulo}>
        Bienvenido al mundo de la Bundesliga
      </Text>

      {/* Campo de correo */}
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={correo}
        onChangeText={setCorreo}
      />

      {/* Campo de contraseña */}
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        secureTextEntry={true}
        value={contrasena}
        onChangeText={setContrasena}
      />

      {/* Mensaje de error */}
      {mensaje ? (
        <Text style={styles.error}>
          {mensaje}
        </Text>
      ) : null}

      {/* Botón para iniciar sesión */}
      <Pressable
        style={styles.boton}
        onPress={iniciarSesion}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBoton}>
            INICIAR SESIÓN
          </Text>
        )}
      </Pressable>

      {/* Ir a registro */}
      <Pressable
        onPress={() => navigation.navigate("Registro")}
      >
        <Text style={styles.enlace}>
          ¿No tienes cuenta? Regístrate aquí
        </Text>
      </Pressable>

    </View>
  );
}

// Estilos de la pantalla
const styles = StyleSheet.create({

  contenedor: {
    flex: 1,
    backgroundColor: "#101010",
    justifyContent: "center",
    padding: 25,
  },

  logo: {
    fontSize: 70,
    textAlign: "center",
    marginBottom: 15,
  },

  titulo: {
    color: "#FFD700",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitulo: {
    color: "#CCCCCC",
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 40,
  },

  input: {
    backgroundColor: "#222222",
    color: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#444444",
    fontSize: 16,
  },

  boton: {
    backgroundColor: "#D71920",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  textoBoton: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  enlace: {
    color: "#FFD700",
    textAlign: "center",
    marginTop: 25,
    fontSize: 14,
  },

  error: {
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 10,
    fontSize: 14,
  },

});