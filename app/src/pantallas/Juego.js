import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../firebase/config";

const API_URL =
  "https://api.openligadb.de/getmatchdata/bl1/2026";

// Obtener la fecha de un partido
function obtenerFecha(partido) {
  const fecha =
    partido.matchDateTimeUTC ||
    partido.matchDateTime;

  return new Date(fecha).getTime();
}

// Buscar el resultado final oficial
function obtenerResultadoFinal(partido) {
  if (
    !partido ||
    !partido.matchIsFinished ||
    !Array.isArray(partido.matchResults)
  ) {
    return null;
  }

  return (
    partido.matchResults.find(
      (resultado) => Number(resultado.resultTypeID) === 2
    ) || null
  );
}

// Calcular los puntos de una predicción
function calcularPuntos(pronostico, partido) {
  const resultado = obtenerResultadoFinal(partido);

  if (!resultado) {
    return null;
  }

  const golesLocal = Number(pronostico.golesLocal);
  const golesVisitante = Number(pronostico.golesVisitante);

  const realLocal = Number(resultado.pointsTeam1);
  const realVisitante = Number(resultado.pointsTeam2);

  // Marcador exacto: 3 puntos
  if (
    golesLocal === realLocal &&
    golesVisitante === realVisitante
  ) {
    return 3;
  }

  // Acertar ganador o empate: 1 punto
  const prediccionGanador = Math.sign(
    golesLocal - golesVisitante
  );

  const resultadoGanador = Math.sign(
    realLocal - realVisitante
  );

  if (prediccionGanador === resultadoGanador) {
    return 1;
  }

  // Pronóstico incorrecto: 0 puntos
  return 0;
}

export default function Juego() {
  const [todosPartidos, setTodosPartidos] = useState([]);
  const [proximosPartidos, setProximosPartidos] = useState([]);

  const [pronosticos, setPronosticos] = useState({});
  const [guardados, setGuardados] = useState({});
  const [mensajes, setMensajes] = useState({});

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState("");

  // Cargar partidos y pronósticos guardados
  const cargarDatos = async () => {
    setCargando(true);
    setError("");

    try {
      const usuario = auth.currentUser;

      if (!usuario) {
        throw new Error("Debes iniciar sesión.");
      }

      // Obtener los partidos desde OpenLigaDB
      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los partidos.");
      }

      const partidos = await respuesta.json();

      if (!Array.isArray(partidos)) {
        throw new Error("Respuesta incorrecta de la API.");
      }

      setTodosPartidos(partidos);

      // Buscar próximos partidos
      const ahora = Date.now();

      const proximos = partidos
        .filter((partido) => {
          const fecha = obtenerFecha(partido);

          return (
            !partido.matchIsFinished &&
            Number.isFinite(fecha) &&
            fecha > ahora
          );
        })
        .sort(
          (a, b) => obtenerFecha(a) - obtenerFecha(b)
        )
        .slice(0, 10);

      setProximosPartidos(proximos);

      // Cargar los pronósticos desde Firestore
      const referencia = collection(
        db,
        "usuarios",
        usuario.uid,
        "quinielas"
      );

      const documentos = await getDocs(referencia);

      const datosGuardados = {};
      const marcadores = {};

      documentos.forEach((documento) => {
        const id = documento.id;
        const datos = documento.data();

        datosGuardados[id] = datos;

        marcadores[id] = {
          local: String(datos.golesLocal),
          visitante: String(datos.golesVisitante),
        };
      });

      setGuardados(datosGuardados);
      setPronosticos(marcadores);
    } catch (error) {
      console.log("Error al cargar Quiniela:", error);

      setError(
        "No fue posible cargar los partidos o tus pronósticos."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Modificar el marcador
  const cambiarMarcador = (id, equipo, valor) => {
    if (!/^\d{0,2}$/.test(valor)) {
      return;
    }

    setPronosticos((anteriores) => ({
      ...anteriores,

      [id]: {
        ...(anteriores[id] || {}),
        [equipo]: valor,
      },
    }));

    setMensajes((anteriores) => ({
      ...anteriores,
      [id]: "",
    }));
  };

  // Guardar pronóstico en Firebase
  const guardarPronostico = async (partido) => {
    const usuario = auth.currentUser;
    const id = String(partido.matchID);

    if (!usuario) {
      return;
    }

    const local = pronosticos[id]?.local;
    const visitante = pronosticos[id]?.visitante;

    if (
      local === undefined ||
      visitante === undefined ||
      local === "" ||
      visitante === ""
    ) {
      setMensajes((anteriores) => ({
        ...anteriores,
        [id]: "⚠️ Escribe los goles de ambos equipos.",
      }));

      return;
    }

    if (Date.now() >= obtenerFecha(partido)) {
      setMensajes((anteriores) => ({
        ...anteriores,
        [id]: "❌ El partido ya comenzó.",
      }));

      return;
    }

    setGuardando(id);

    try {
      const datos = {
        matchID: partido.matchID,

        equipoLocal: partido.team1.teamName,
        equipoVisitante: partido.team2.teamName,

        golesLocal: Number(local),
        golesVisitante: Number(visitante),

        fechaPartido:
          partido.matchDateTimeUTC ||
          partido.matchDateTime,

        actualizadoEn: serverTimestamp(),
      };

      const referencia = doc(
        db,
        "usuarios",
        usuario.uid,
        "quinielas",
        id
      );

      await setDoc(referencia, datos);

      setGuardados((anteriores) => ({
        ...anteriores,
        [id]: datos,
      }));

      setMensajes((anteriores) => ({
        ...anteriores,
        [id]: "✅ Pronóstico guardado correctamente.",
      }));
    } catch (error) {
      console.log("Error al guardar:", error);

      setMensajes((anteriores) => ({
        ...anteriores,
        [id]: "❌ No fue posible guardar.",
      }));
    } finally {
      setGuardando(null);
    }
  };

  // Crear el historial de pronósticos
  const historial = Object.entries(guardados)
    .map(([id, pronostico]) => {
      const partido = todosPartidos.find(
        (item) => String(item.matchID) === id
      );

      const resultado = obtenerResultadoFinal(partido);

      return {
        ...pronostico,
        id,
        puntos: calcularPuntos(pronostico, partido),

        resultadoFinal: resultado
          ? `${resultado.pointsTeam1} - ${resultado.pointsTeam2}`
          : null,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.fechaPartido).getTime() -
        new Date(a.fechaPartido).getTime()
    );

  // Calcular estadísticas
  const puntosTotales = historial.reduce(
    (total, pronostico) =>
      total + (pronostico.puntos ?? 0),
    0
  );

  const pronosticosResueltos = historial.filter(
    (pronostico) => pronostico.puntos !== null
  ).length;

  const pronosticosPendientes = historial.filter(
    (pronostico) => pronostico.puntos === null
  ).length;

  return (
    <SafeAreaView style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.titulo}>
          🎮 QUINIELA BUNDESLIGA
        </Text>

        <Text style={styles.subtitulo}>
          ¡Adivina los resultados y gana puntos!
        </Text>

        {/* Puntuación del jugador */}
        <View style={styles.tarjetaPuntos}>
          <Text style={styles.tituloPuntos}>
            🏆 MIS PUNTOS
          </Text>

          <Text style={styles.puntosGrandes}>
            {puntosTotales}
          </Text>

          <Text style={styles.descripcionPuntos}>
            Puntos acumulados
          </Text>

          <View style={styles.estadisticas}>
            <View style={styles.estadistica}>
              <Text style={styles.numeroEstadistica}>
                {historial.length}
              </Text>

              <Text style={styles.etiquetaEstadistica}>
                Pronósticos
              </Text>
            </View>

            <View style={styles.estadistica}>
              <Text style={styles.numeroEstadistica}>
                {pronosticosResueltos}
              </Text>

              <Text style={styles.etiquetaEstadistica}>
                Resueltos
              </Text>
            </View>

            <View style={styles.estadistica}>
              <Text style={styles.numeroEstadistica}>
                {pronosticosPendientes}
              </Text>

              <Text style={styles.etiquetaEstadistica}>
                Pendientes
              </Text>
            </View>
          </View>
        </View>

        {/* Reglas */}
        <View style={styles.reglas}>
          <Text style={styles.tituloReglas}>
            📋 Reglas de la Quiniela
          </Text>

          <Text style={styles.textoRegla}>
            🎯 Marcador exacto: 3 puntos
          </Text>

          <Text style={styles.textoRegla}>
            ✅ Acertar ganador o empate: 1 punto
          </Text>

          <Text style={styles.textoRegla}>
            ❌ Resultado incorrecto: 0 puntos
          </Text>
        </View>

        <View style={styles.encabezado}>
          <Text style={styles.seccion}>
            ⚽ Próximos partidos
          </Text>

          <Pressable
            onPress={cargarDatos}
            disabled={cargando}
          >
            <Text style={styles.actualizar}>
              🔄 Actualizar
            </Text>
          </Pressable>
        </View>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#FFD700"
            style={{ marginVertical: 35 }}
          />
        ) : (
          <>
            {error !== "" && (
              <Text style={styles.error}>
                {error}
              </Text>
            )}

            {proximosPartidos.length === 0 && (
              <Text style={styles.aviso}>
                No hay próximos partidos con fecha disponible.
              </Text>
            )}

            {/* Partidos disponibles para pronosticar */}
            {proximosPartidos.map((partido) => {
              const id = String(partido.matchID);
              const prediccion = pronosticos[id] || {};
              const guardado = guardados[id];

              const sinCambios =
                guardado &&
                String(guardado.golesLocal) ===
                  prediccion.local &&
                String(guardado.golesVisitante) ===
                  prediccion.visitante;

              const fecha = new Date(
                partido.matchDateTimeUTC ||
                partido.matchDateTime
              );

              return (
                <View
                  key={id}
                  style={styles.tarjetaPartido}
                >
                  <Text style={styles.fecha}>
                    📅 {fecha.toLocaleString("es-CO")}
                  </Text>

                  <View style={styles.equipos}>
                    <View style={styles.equipo}>
                      <Text style={styles.nombreEquipo}>
                        {partido.team1.teamName}
                      </Text>

                      <TextInput
                        style={styles.marcador}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor="#777777"
                        value={prediccion.local || ""}
                        onChangeText={(valor) =>
                          cambiarMarcador(
                            id,
                            "local",
                            valor
                          )
                        }
                      />
                    </View>

                    <Text style={styles.vs}>
                      VS
                    </Text>

                    <View style={styles.equipo}>
                      <Text style={styles.nombreEquipo}>
                        {partido.team2.teamName}
                      </Text>

                      <TextInput
                        style={styles.marcador}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor="#777777"
                        value={prediccion.visitante || ""}
                        onChangeText={(valor) =>
                          cambiarMarcador(
                            id,
                            "visitante",
                            valor
                          )
                        }
                      />
                    </View>
                  </View>

                  <Pressable
                    style={styles.botonGuardar}
                    disabled={guardando === id}
                    onPress={() =>
                      guardarPronostico(partido)
                    }
                  >
                    <Text style={styles.textoBoton}>
                      {guardando === id
                        ? "Guardando..."
                        : "💾 Guardar pronóstico"}
                    </Text>
                  </Pressable>

                  {sinCambios && (
                    <Text style={styles.guardado}>
                      ✅ Pronóstico guardado
                    </Text>
                  )}

                  {mensajes[id] ? (
                    <Text style={styles.mensaje}>
                      {mensajes[id]}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            {/* Historial */}
            <Text style={styles.seccionHistorial}>
              📚 Mis pronósticos
            </Text>

            {historial.length === 0 ? (
              <Text style={styles.aviso}>
                Todavía no tienes pronósticos guardados.
              </Text>
            ) : (
              historial.map((pronostico) => (
                <View
                  key={pronostico.id}
                  style={styles.tarjetaHistorial}
                >
                  <Text style={styles.partidoHistorial}>
                    {pronostico.equipoLocal}
                  </Text>

                  <Text style={styles.partidoHistorial}>
                    VS
                  </Text>

                  <Text style={styles.partidoHistorial}>
                    {pronostico.equipoVisitante}
                  </Text>

                  <Text style={styles.prediccion}>
                    Tu pronóstico:{" "}
                    {pronostico.golesLocal} -{" "}
                    {pronostico.golesVisitante}
                  </Text>

                  {pronostico.puntos === null ? (
                    <Text style={styles.pendiente}>
                      ⏳ Pendiente de resultado
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.resultado}>
                        Resultado final:{" "}
                        {pronostico.resultadoFinal}
                      </Text>

                      <Text style={styles.puntosGanados}>
                        🏆 {pronostico.puntos} puntos
                      </Text>
                    </>
                  )}
                </View>
              ))
            )}
          </>
        )}

        <Text style={styles.fuente}>
          Datos: OpenLigaDB (ODbL 1.0)
        </Text>
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
    paddingBottom: 50,
  },

  titulo: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 15,
  },

  subtitulo: {
    color: "#CCCCCC",
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 25,
  },

  tarjetaPuntos: {
    backgroundColor: "#242424",
    borderRadius: 14,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444444",
  },

  tituloPuntos: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
  },

  puntosGrandes: {
    color: "#FFD700",
    fontSize: 60,
    fontWeight: "bold",
    marginTop: 10,
  },

  descripcionPuntos: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 20,
  },

  estadisticas: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },

  estadistica: {
    alignItems: "center",
  },

  numeroEstadistica: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  etiquetaEstadistica: {
    color: "#AAAAAA",
    fontSize: 12,
    marginTop: 5,
  },

  reglas: {
    backgroundColor: "#202020",
    padding: 18,
    borderRadius: 10,
    marginBottom: 30,
  },

  tituloReglas: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  textoRegla: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 10,
  },

  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  seccion: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
  },

  actualizar: {
    color: "#FFFFFF",
    fontSize: 13,
  },

  tarjetaPartido: {
    backgroundColor: "#202020",
    borderRadius: 12,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#333333",
  },

  fecha: {
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 20,
    fontSize: 13,
  },

  equipos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  equipo: {
    flex: 1,
    alignItems: "center",
  },

  nombreEquipo: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    minHeight: 40,
  },

  marcador: {
    backgroundColor: "#333333",
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    width: 65,
    height: 55,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555555",
  },

  vs: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 18,
    marginHorizontal: 15,
  },

  botonGuardar: {
    backgroundColor: "#D71920",
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
  },

  textoBoton: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  guardado: {
    color: "#40C463",
    textAlign: "center",
    marginTop: 12,
  },

  mensaje: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 12,
  },

  seccionHistorial: {
    color: "#FFD700",
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 35,
    marginBottom: 20,
  },

  tarjetaHistorial: {
    backgroundColor: "#242424",
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
  },

  partidoHistorial: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 5,
    fontWeight: "bold",
  },

  prediccion: {
    color: "#FFD700",
    fontSize: 16,
    textAlign: "center",
    marginTop: 15,
    fontWeight: "bold",
  },

  pendiente: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 10,
  },

  resultado: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 12,
  },

  puntosGanados: {
    color: "#40C463",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },

  aviso: {
    color: "#CCCCCC",
    textAlign: "center",
    marginVertical: 25,
  },

  error: {
    color: "#FF6666",
    textAlign: "center",
    marginVertical: 20,
  },

  fuente: {
    color: "#888888",
    fontSize: 11,
    textAlign: "center",
    marginTop: 25,
  },
});