import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../firebase/config";

export default function Perfil() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarPerfil = async () => {
    setCargando(true);
    setError("");

    try {
      const usuario = auth.currentUser;

      if (!usuario) {
        throw new Error("No hay una sesión iniciada.");
      }

      // Buscar el documento del usuario en Firestore
      const referencia = doc(
        db,
        "usuarios",
        usuario.uid
      );

      const documento = await getDoc(referencia);

      if (documento.exists()) {
        setDatos(documento.data());
      } else {
        setDatos(null);
        setError(
          "No se encontró tu información en Firestore."
        );
      }
    } catch (error) {
      console.log("Error al cargar perfil:", error);

      setError(
        "No fue posible cargar tu perfil."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const usuario = auth.currentUser;

  const nombre =
    datos?.nombre ||
    usuario?.displayName ||
    "Usuario";

  const correo =
    datos?.correo ||
    usuario?.email ||
    "No disponible";

  // Convertir la fecha de Firestore a una fecha normal
  const fecha = datos?.fechaRegistro?.toDate?.();

  const fechaTexto = fecha
    ? fecha.toLocaleDateString("es-CO")
    : "No disponible";

  const iniciales = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join("");

  return (
    <SafeAreaView style={styles.contenedor}>
      <ScrollView
        contentContainerStyle={styles.contenido}
      >
        <Text style={styles.titulo}>
          👤 MI PERFIL
        </Text>

        <Text style={styles.subtitulo}>
          Información de mi cuenta
        </Text>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#FFD700"
            style={{ marginTop: 60 }}
          />
        ) : (
          <>
            <View style={styles.tarjeta}>
              <View style={styles.avatar}>
                <Text style={styles.iniciales}>
                  {iniciales}
                </Text>
              </View>

              <Text style={styles.nombre}>
                {nombre}
              </Text>

              <Text style={styles.tipoUsuario}>
                ⚽ Aficionado de la Bundesliga
              </Text>
            </View>

            <Text style={styles.seccion}>
              📋 Mis datos
            </Text>

            <View style={styles.campo}>
              <Text style={styles.etiqueta}>
                Nombre completo
              </Text>

              <Text style={styles.valor}>
                {nombre}
              </Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.etiqueta}>
                Correo electrónico
              </Text>

              <Text style={styles.valor}>
                {correo}
              </Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.etiqueta}>
                Fecha de registro
              </Text>

              <Text style={styles.valor}>
                {fechaTexto}
              </Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.etiqueta}>
                Estado de la cuenta
              </Text>

              <Text style={styles.estado}>
                ● Sesión iniciada
              </Text>
            </View>

            {error !== "" && (
              <Text style={styles.error}>
                {error}
              </Text>
            )}

            <Pressable
              style={styles.boton}
              onPress={cargarPerfil}
            >
              <Text style={styles.textoBoton}>
                🔄 Actualizar perfil
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#101010",
  },

  contenido: {
    padding: 20,
    paddingBottom: 40,
  },

  titulo: {
    color: "#FFD700",
    fontSize: 27,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },

  subtitulo: {
    color: "#AAAAAA",
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 30,
  },

  tarjeta: {
    backgroundColor: "#202020",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#333333",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#D71920",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  iniciales: {
    color: "#FFFFFF",
    fontSize: 35,
    fontWeight: "bold",
  },

  nombre: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
  },

  tipoUsuario: {
    color: "#FFD700",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },

  seccion: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },

  campo: {
    backgroundColor: "#242424",
    borderRadius: 10,
    padding: 18,
    marginBottom: 12,
  },

  etiqueta: {
    color: "#AAAAAA",
    fontSize: 13,
    marginBottom: 8,
  },

  valor: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  estado: {
    color: "#40C463",
    fontSize: 16,
    fontWeight: "bold",
  },

  error: {
    color: "#FF6666",
    textAlign: "center",
    marginTop: 15,
  },

  boton: {
    backgroundColor: "#D71920",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  textoBoton: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});