import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";
import { insertLocation, getAllLocations } from "./db";

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false); // variável para controle do darkMode
  const [isLoading, setIsLoading] = useState(false); // variável para controle do loading do button
  const [locations, setLocations] = useState([]); // variável para armazenar as localizações

  // Carrega tema default da lib RN PAPER com customização das cores. Para customizar o tema, veja:
  // https://callstack.github.io/react-native-paper/docs/guides/theming/#creating-dynamic-theme-colors
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  // load darkMode from AsyncStorage
  async function loadDarkMode() {
    try {
      const darkModeOn = await AsyncStorage.getItem("preferences-key");

      darkModeOn === "true" ? setIsSwitchOn(true) : setIsSwitchOn(false);

    } catch (e) {
      throw e;
   }
  }

  // darkMode switch event
  async function onToggleSwitch() {
    setIsSwitchOn(!isSwitchOn);
    try {
      await AsyncStorage.setItem("preferences-key", isSwitchOn.toString())
    } catch (e) {
      throw e;
    }
  }

  // get location (bottao capturar localização)
  async function getLocation() {
    setIsLoading(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const { coords } = await Location.getCurrentPositionAsync({});
      await insertLocation(coords);
      console.log(coords)
      setLocations(prevLocations => [...prevLocations, coords]);
    } else {
      console.log('algo deu errado')
    }

    setIsLoading(false);
  }

  // load locations from db sqlite - faz a leitura das localizações salvas no banco de dados
  async function loadLocations() {
    setIsLoading(true);
    try {
      const locations = await getAllLocations();
      setLocations(locations);
    } catch (error) {
      console.error("Erro ao carregar localizações:", error);
    }
    setIsLoading(false);
  }

  // Use Effect para carregar o darkMode e as localizações salvas no banco de dados
  // É executado apenas uma vez, quando o componente é montado
  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  // Efetiva a alteração do tema dark/light quando a variável isSwitchOn é alterada
  // É executado sempre que a variável isSwitchOn é alterada
  useEffect(() => {
    setTheme({
      ...theme,
      colors: isSwitchOn ? myColorsDark.colors : myColors.colors,
    });
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={() => getLocation()}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            ></List.Item>
          )}
        ></FlatList>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
