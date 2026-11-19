import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";

// API de la Bundesliga 2026/2027
const API_URL =
  "https://api.openligadb.de/getbltable/bl1/2026";

export default function Home() {

  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Consultar la tabla de posiciones
  const cargarEquipos = async () => {
    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("Error al consultar la API");
      }

      const datos = await respuesta.json();

      if (!Array.isArray(datos)) {
        throw new Error("Formato de datos incorrecto");
      }

      setEquipos(datos);

    } catch (error) {
      console.log("Error de OpenLigaDB:", error);

      setError(
        "No se pudo cargar la Bundesliga. Comprueba tu conexión."
      );

    } finally {
      setCargando(false);
    }
  };

  // Cargar equipos al abrir Home
  useEffect(() => {
    cargarEquipos();
  }, []);

  // Buscar equipos por nombre
  const equiposFiltrados = equipos
    .map((equipo, indice) => ({
      ...equipo,
      posicion: indice + 1,
    }))
    .filter((equipo) =>
      (equipo.teamName || "")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );

  // Dibujar cada equipo
  const mostrarEquipo = ({ item }) => (
    <View style={styles.fila}>

      <Text style={styles.posicion}>
        {item.posicion}
      </Text>

      <Text
        style={styles.nombreEquipo}
        numberOfLines={1}
      >
        {item.teamName}
      </Text>

      <Text style={styles.estadistica}>
        {item.matches ?? 0}
      </Text>

      <Text style={styles.estadistica}>
        {item.goalDiff ?? 0}
      </Text>

      <Text style={styles.puntos}>
        {item.points ?? 0}
      </Text>

    </View>
  );

  return (
    <SafeAreaView style={styles.contenedor}>

      {/* Encabezado */}
      <View style={styles.encabezado}>

        <View>
          <Text style={styles.titulo}>
            ⚽ LIGA ALEMANA
          </Text>

          <Text style={styles.subtitulo}>
            Bundesliga 2026/2027
          </Text>
        </View>

        <Pressable
          style={styles.botonSalir}
          onPress={() => signOut(auth)}
        >
          <Text style={styles.textoSalir}>
            Salir
          </Text>
        </Pressable>

      </View>

      {/* Bienvenida */}
      <Text style={styles.bienvenida}>
        Bienvenido, {auth.currentUser?.displayName || "aficionado"}
      </Text>

      {/* Buscador */}
      <TextInput
        style={styles.buscador}
        placeholder="🔎 Buscar equipo..."
        placeholderTextColor="#999"
        value={busqueda}
        onChangeText={setBusqueda}
      />

      <Text style={styles.seccion}>
        🏆 Tabla de posiciones
      </Text>

      {/* Encabezado de la tabla */}
      <View style={styles.encabezadoTabla}>

        <Text style={styles.posicion}>
          #
        </Text>

        <Text style={styles.nombreEquipo}>
          Equipo
        </Text>

        <Text style={styles.estadistica}>
          PJ
        </Text>

        <Text style={styles.estadistica}>
          DG
        </Text>

        <Text style={styles.puntos}>
          PTS
        </Text>

      </View>

      {/* Cargando */}
      {cargando ? (
        <ActivityIndicator
          size="large"
          color="#FFD700"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={equiposFiltrados}
          keyExtractor={(item, index) =>
            String(item.teamInfoId ?? index)
          }
          renderItem={mostrarEquipo}
          ListEmptyComponent={
            <Text style={styles.mensaje}>
              {error || "No se encontraron equipos."}
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Actualizar datos */}
      <Pressable
        style={styles.botonActualizar}
        onPress={cargarEquipos}
        disabled={cargando}
      >
        <Text style={styles.textoActualizar}>
          🔄 Actualizar clasificación
        </Text>
      </Pressable>

      <Text style={styles.fuente}>
        Datos proporcionados por OpenLigaDB
      </Text>

    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({

  contenedor: {
    flex: 1,
    backgroundColor: "#101010",
    paddingHorizontal: 15,
  },

  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  titulo: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitulo: {
    color: "#CCCCCC",
    fontSize: 13,
    marginTop: 5,
  },

  botonSalir: {
    backgroundColor: "#D71920",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },

  textoSalir: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  bienvenida: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 25,
    marginBottom: 20,
  },

  buscador: {
    backgroundColor: "#242424",
    color: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
  },

  seccion: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  encabezadoTabla: {
    backgroundColor: "#D71920",
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  fila: {
    backgroundColor: "#202020",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },

  posicion: {
    color: "#FFFFFF",
    width: 30,
    textAlign: "center",
    fontWeight: "bold",
  },

  nombreEquipo: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 14,
    marginRight: 5,
  },

  estadistica: {
    color: "#CCCCCC",
    width: 40,
    textAlign: "center",
  },

  puntos: {
    color: "#FFD700",
    width: 45,
    textAlign: "center",
    fontWeight: "bold",
  },

  botonActualizar: {
    backgroundColor: "#333333",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  textoActualizar: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  mensaje: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 40,
  },

  fuente: {
    color: "#888888",
    fontSize: 11,
    textAlign: "center",
    marginVertical: 12,
  },

});