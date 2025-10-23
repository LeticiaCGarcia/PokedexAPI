import { useState, useEffect, useMemo } from "react";
import "./App.css";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";


// APIS DOS POKÉMONS - pokeAPI -  https://pokeapi.co/
// DETALHES:
// https://pokeapi.co/api/v2/pokemon?limit=1000  / LISTA COMPLETA
// https://pokeapi.co/api/v2/pokemon/{nome}  / DETALHES DO POKEMON
// https://pokeapi.co/api/v2/pokemon-species/{nome} E https://pokeapi.co/api/v2/evolution-chain/{id} / PARA EVOLUÇÃO
// https://pokeapi.co/api/v2/type/{tipo}    / ONDE BUSCAR POR TIPO
// https://img.pokemondb.net/sprites/home/...   /SHINY


function App() {
  const [busca, setBusca] = useState("");
  const [pokemon, setPokemon] = useState(null);
  const [listaTipo, setListaTipo] = useState([]);
  const [erro, setErro] = useState("");
  const [todosPokemons, setTodosPokemons] = useState([]);
  const [sugestoes, setSugestoes] = useState([]);
  const [modoEscuro, setModoEscuro] = useState(false);
  const [painelAberto, setPainelAberto] = useState(false);
  const [flashAtivo, setFlashAtivo] = useState(false);

  const [shiny, setShiny] = useState(false);

// EVOLUÇÃO
  const [evolucao, setEvolucao] = useState([]); 
  const [carregandoEvolucao, setCarregandoEvolucao] = useState(false);

  const [favoritos, setFavoritos] = useState(() => {
    const salvos = localStorage.getItem("favoritos");
    return salvos ? JSON.parse(salvos) : [];
  });

  const somPokeball = new Audio("/src/assets/pokeball.mp3"); somPokeball.volume = 0.6;
  const somShiny = new Audio("/src/assets/shiny.mp3");
  const somAparecer = new Audio("/src/assets/open.mp3");


  function mostrarFlash() {
    setFlashAtivo(true);
    setTimeout(() => setFlashAtivo(false), 600);
  }

  // LISTA
  useEffect(() => {
    async function carregarLista() {
      const resposta = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
      const data = await resposta.json();
      setTodosPokemons(data.results);
    }
    carregarLista();
  }, []);


  useEffect(() => {
    const cache = JSON.parse(localStorage.getItem("pokeCache")) || {};
    if (pokemon && !cache[pokemon.name]) {
      cache[pokemon.name] = pokemon.sprites.front_default;
      localStorage.setItem("pokeCache", JSON.stringify(cache));
    }
  }, [pokemon]);

  async function buscarPokemon(nomePokemon) {
    const nome = nomePokemon || busca;
    if (!nome) {
      setErro("Digite o nome de um Pokémon!");
      return;
    }
    try {
      mostrarFlash();
      setErro("");
      setListaTipo([]);
      setPokemon(null);
      setSugestoes([]);
      setShiny(false); 
      const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome.toLowerCase()}`);
      if (!resposta.ok) throw new Error("Pokémon não encontrado");
      const data = await resposta.json();
      setPokemon(data);
      somAparecer.play();
    } catch (err) {
      setErro(err.message);
    }
  }

  // LISTA DOS TIPOS
  async function buscarPorTipo(tipoAPI) {
    setErro("");
    setPokemon(null);
    setListaTipo([]);
    try {
      const resposta = await fetch(`https://pokeapi.co/api/v2/type/${tipoAPI}`);
      const data = await resposta.json();
      const lista = data.pokemon.map((p) => p.pokemon);
      setListaTipo(lista);
    } catch (err) {
      setErro("Erro ao carregar pokémons do tipo selecionado.");
    }
  }

  // BOTAO DO ALEATÓRIO
  async function buscarAleatorio() {
    const numero = Math.floor(Math.random() * 898) + 1;
    try {
      mostrarFlash();
      somAparecer.play();
      setErro("");
      setListaTipo([]);
      setPokemon(null);
      setShiny(false);
      const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${numero}`);
      const data = await resposta.json();
      setPokemon(data);
    } catch {
      setErro("Erro ao buscar Pokémon aleatório.");
    }
  }

  function atualizarBusca(valor) {
    setBusca(valor);
    if (valor.length > 1) {
      const filtradas = todosPokemons.filter((p) =>
        p.name.toLowerCase().startsWith(valor.toLowerCase())
      );
      setSugestoes(filtradas.slice(0, 6));
    } else {
      setSugestoes([]);
    }
  }

  // BOTÃO DE REMOVER
  function alternarFavorito(pk) {
    const jaFavorito = favoritos.find((f) => f.name === pk.name);
    let novaLista;
    if (jaFavorito) {
      novaLista = favoritos.filter((f) => f.name !== pk.name);
    } else {
      somPokeball.play();
      novaLista = [...favoritos, { name: pk.name, img: pk.sprites.front_default }];
    }
    setFavoritos(novaLista);
    localStorage.setItem("favoritos", JSON.stringify(novaLista));
  }

  function removerFavorito(nome) {
    const novaLista = favoritos.filter((f) => f.name !== nome);
    setFavoritos(novaLista);
    localStorage.setItem("favoritos", JSON.stringify(novaLista));
  }

const coresTipo = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
  default: "#A8A77A"
};


  const cache = JSON.parse(localStorage.getItem("pokeCache")) || {};

  const dadosRadar = useMemo(() => {
    if (!pokemon?.stats) return [];
    return pokemon.stats.map((s) => ({
      stat: s.stat.name.toUpperCase(),
      value: s.base_stat,
    }));
  }, [pokemon]);

  useEffect(() => {
    async function carregarEvolucao(pk) {
      if (!pk) {
        setEvolucao([]);
        return;
      }
      try {
        setCarregandoEvolucao(true);
        const speciesResp = await fetch(pk.species.url);
        const species = await speciesResp.json();
        const evoResp = await fetch(species.evolution_chain.url);
        const evo = await evoResp.json();

        const lista = [];
        function walk(node) {
          if (!node) return;
          const url = node.species.url; 
          const id = url.split("/").filter(Boolean).pop();
          lista.push({ name: node.species.name, id });
          if (node.evolves_to && node.evolves_to.length) {
            node.evolves_to.forEach(walk);
          }
        }
        walk(evo.chain);
        setEvolucao(lista);
      } catch (e) {
        setEvolucao([]);
      } finally {
        setCarregandoEvolucao(false);
      }
    }
    carregarEvolucao(pokemon);
  }, [pokemon]);

  const spriteFrente =
    pokemon &&
    (shiny
      ? `https://img.pokemondb.net/sprites/home/shiny/${pokemon.name}.png`
      : `https://img.pokemondb.net/sprites/home/normal/${pokemon.name}.png`);

  const spriteCostas =
    pokemon &&
    (shiny
      ? pokemon.sprites.back_shiny
      : pokemon.sprites.back_default);

  return (
    <div className={`pagina ${modoEscuro ? "modo-escuro" : ""}`}>
      {flashAtivo && <div className="flash-pokeball"></div>}

      <header className="navbar">
        <div className="navbar-logo">
          <img
            src="https://img.pokemondb.net/sprites/items/poke-ball.png"
            alt="Pokédex"
          />
          <h1>Pokédex</h1>
        </div>

        <div className="navbar-actions">
          <button className="btn-nav" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Buscar
          </button>

          <button className="btn-nav" onClick={buscarAleatorio}>
            🎲 Aleatório
          </button>

          <button className="btn-nav" onClick={() => setPainelAberto(true)}>
            ⭐ Favoritos ({favoritos.length})
          </button>

          <button className="btn-tema" onClick={() => setModoEscuro(!modoEscuro)}>
            {modoEscuro ? "☀️ Claro" : "🌙 Escuro"}
          </button>
        </div>
      </header>

      <div className={`painel-favoritos ${painelAberto ? "aberto" : ""}`}>
        <div className="painel-topo">
          <h2>⭐ Meus Favoritos</h2>
          <button className="fechar" onClick={() => setPainelAberto(false)}>✖</button>
        </div>
        <div className="lista-favoritos">
          {favoritos.length === 0 ? (
            <p>Você ainda não favoritou nenhum Pokémon.</p>
          ) : (
            favoritos.map((p) => (
              <div key={p.name} className="card-favorito animar">
                <img
                  src={cache[p.name] || p.img}
                  alt={p.name}
                  loading="lazy"
                  onError={(e) => (e.target.src = "/src/assets/placeholder.png")}
                />
                <p>{p.name}</p>
                <button className="remover-fav" onClick={() => removerFavorito(p.name)}>❌</button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="app-container">
        <div className="tipos-container">
          {Object.keys(coresTipo)
            .filter((t) => t !== "default")
            .map((tipo) => (
              <button
                key={tipo}
                className={`tipo ${tipo}`}
                style={{ background: coresTipo[tipo] }}
                onClick={() => buscarPorTipo(tipo)}
              >
                {tipo.toUpperCase()}
              </button>
            ))}
        </div>

        {/* BARRA DE BUSCA */}
        <div className="busca-container">
          <input
            type="text"
            placeholder="Digite o nome do Pokémon..."
            value={busca}
            onChange={(e) => atualizarBusca(e.target.value)}
          />
          <button onClick={() => buscarPokemon()}>Buscar</button>
          {sugestoes.length > 0 && (
            <ul className="sugestoes-lista">
              {sugestoes.map((s) => (
                <li
                  key={s.name}
                  onClick={() => {
                    setBusca(s.name);
                    buscarPokemon(s.name);
                    setSugestoes([]);
                  }}
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {erro && <p className="erro">{erro}</p>}

        {pokemon && (
          <>
            <div
              className="resultado animar"
              style={{
                borderTop: `8px solid ${
                  coresTipo[pokemon.types?.[0]?.type?.name] || coresTipo.default
                }`,
              }}
            >
              <div className="pokemon-imagem">
                {/* Frente (PokéDB) */}
                <img
                  className={shiny ? "sprite shiny-brilho" : "sprite"}
                  src={spriteFrente}
                  alt={shiny ? "frente shiny" : "frente"}
                  loading="lazy"
                  onError={(e) =>
                    (e.target.src =
                      pokemon.sprites.front_default || "/src/assets/placeholder.png")
                  }
                />

      
                {spriteCostas && (
                  <img
                    className={shiny ? "sprite shiny-brilho" : "sprite"}
                    src={spriteCostas}
                    alt={shiny ? "costas shiny" : "costas"}
                    loading="lazy"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}

                {/* BOTAO SHINY */}
                <button
                  className={`btn-shiny ${shiny ? "ativo" : ""}`}
                  onClick={() => {
                    somShiny.play();
                    setShiny((v) => !v);
                  }}
                  title="Alternar Shiny"
                >
                  ✨ Shiny
                </button>
              </div>

              <div className="pokemon-info">
                <h2>{pokemon.name.toUpperCase()}</h2>
                <p><b>Tipo:</b> {pokemon.types.map((t) => t.type.name).join(", ")}</p>
                <p><b>Peso:</b> {pokemon.weight / 10} kg</p>
                <p><b>Altura:</b> {pokemon.height / 10} m</p>
                <button
                  className={`botao-favorito ${
                    favoritos.some((f) => f.name === pokemon.name) ? "ativo" : ""
                  }`}
                  onClick={() => alternarFavorito(pokemon)}
                >
                  ⭐ {favoritos.some((f) => f.name === pokemon.name) ? "Favorito" : "Favoritar"}
                </button>
              </div>
            </div>

            <div className="evolucao-container animar">
              <h3>Linha Evolutiva</h3>
              {carregandoEvolucao ? (
                <p>Carregando evoluções...</p>
              ) : evolucao.length === 0 ? (
                <p>Não há dados de evolução para este Pokémon.</p>
              ) : (
                <div className="evolucao-lista">
                  {evolucao.map((ev, idx) => (
                    <div key={ev.name} className="evo-item" onClick={() => buscarPokemon(ev.name)}>
                      <img
                        src={`https://img.pokemondb.net/sprites/home/normal/${ev.name}.png`}
                        alt={ev.name}
                        loading="lazy"
                        onError={(e) => {
                          // fallback pelo id (PokeAPI sprite clássico)
                          e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${ev.id}.png`;
                        }}
                      />
                      <span>{ev.name}</span>
                      {idx < evolucao.length - 1 && <div className="evo-seta">→</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GRAFICO */}
            <div className="stats-card animar">
              <h3>Atributos base</h3>
              <div className="radar-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={dadosRadar} cx="50%" cy="50%" outerRadius="80%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="stat" />
                    <PolarRadiusAxis angle={30} domain={[0, 200]} />
                    <Radar
                      name="Base"
                      dataKey="value"
                      stroke="#3b4cca"
                      fill="#3b4cca"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {listaTipo.length > 0 && (
          <div className="lista-tipo">
            {listaTipo.map((p) => (
              <div key={p.name} className="card-tipo animar" onClick={() => buscarPokemon(p.name)}>
                <img
                  src={
                    cache[p.name] ||
                    `https://img.pokemondb.net/sprites/home/normal/${p.name}.png`
                  }
                  alt={p.name}
                  loading="lazy"
                  onError={(e) =>
                    (e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.url.split("/")[6]}.png`)
                  }
                />
                <p>{p.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
