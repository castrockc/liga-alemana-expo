import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "./firebase/config";


import Login from "./src/pantallas/Login";
import Registro from "./src/pantallas/Registro";
import Home from "./src/pantallas/Home";
import Perfil from "./src/pantallas/Perfil";
import Juego from "./src/pantallas/Juego";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


function PantallaPendiente({ route }) {
  const nombre = route.name;

  return (
    <View style={styles.pantalla}>
      <Text style={styles.emoji}>
        {nombre === "Juego" ? "🎮" : "👤"}
      </Text>

      <Text style={styles.titulo}>
        {nombre === "Juego" ? "QUINIELA BUNDESLIGA" : "MI PERFIL"}
      </Text>

      <Text style={styles.descripcion}>
        {nombre === "Juego"
          ? "Aquí construiremos el juego para predecir resultados de los partidos."
          : "Aquí mostraremos los datos de tu cuenta guardados en Firebase."}
      </Text>

      <Text style={styles.aviso}>
        Esta pantalla la desarrollaremos en el siguiente paso.
      </Text>
    </View>
  );
}

// Pantalla para cerrar sesión
function PantallaSalir() {
  const cerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Error al cerrar sesión:", error);
    }
  };

  return (
    <View style={styles.pantalla}>
      <Text style={styles.emoji}>🚪</Text>

      <Text style={styles.titulo}>CERRAR SESIÓN</Text>

      <Text style={styles.descripcion}>
        ¿Quieres salir de tu cuenta de Liga Alemana?
      </Text>

      <Pressable
        style={styles.botonSalir}
        onPress={cerrarSesion}
      >
        <Text style={styles.textoBoton}>
          CERRAR SESIÓN
        </Text>
      </Pressable>
    </View>
  );
}

// Menú principal de la aplicación
function MenuPrincipal() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: "#191919",
          borderTopColor: "#333333",
          height: 60,
        },

        tabBarActiveTintColor: "#FFD700",
        tabBarInactiveTintColor: "#AAAAAA",

        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "bold",
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={Home}
        options={{
          tabBarLabel: "🏠 Inicio",
        }}
      />

      <Tab.Screen
        name="Juego"
        component={Juego}
        options={{
        tabBarLabel: "🎮 Juego",
  }}
/>

       <Tab.Screen
        name="Perfil"
        component={Perfil}
        options={{
        tabBarLabel: "👤 Perfil",
    }}
  />

      <Tab.Screen
        name="Salir"
        component={PantallaSalir}
        options={{
          tabBarLabel: "🚪 Salir",
        }}
      />
    </Tab.Navigator>
  );
}

// Aplicación principal
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cancelar = onAuthStateChanged(
      auth,
      (usuarioFirebase) => {
        setUsuario(usuarioFirebase);
        setCargando(false);
      }
    );

    return () => cancelar();
  }, []);

  // Esperar a que Firebase revise la sesión
  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator
          size="large"
          color="#FFD700"
        />

        <Text style={styles.textoCarga}>
          Cargando Liga Alemana...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {usuario ? (
          <Stack.Screen
            name="Principal"
            component={MenuPrincipal}
          />
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={Login}
            />

            <Stack.Screen
              name="Registro"
              component={Registro}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Estilos
const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: "#101010",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  emoji: {
    fontSize: 65,
    marginBottom: 20,
  },

  titulo: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  descripcion: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },

  aviso: {
    color: "#AAAAAA",
    fontSize: 13,
    textAlign: "center",
    marginTop: 25,
  },

  botonSalir: {
    backgroundColor: "#D71920",
    paddingVertical: 18,
    paddingHorizontal: 45,
    borderRadius: 10,
    marginTop: 35,
  },

  textoBoton: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  cargando: {
    flex: 1,
    backgroundColor: "#101010",
    justifyContent: "center",
    alignItems: "center",
  },

  textoCarga: {
    color: "#FFFFFF",
    marginTop: 15,
    fontSize: 15,
  },
});