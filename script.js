const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 5;
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

function getElement(id) {
    const element = document.getElementById(id);
    if (!element) console.warn(`Element with ID '${id}' not found`);
    return element;
}

const trendingAnimeContainer = getElement('trendingAnime');
const seasonalAnimeContainer = getElement('seasonalAnime');
const searchResultsContainer = getElement('searchResults');
const homePage = getElement('homePage');
const searchPage = getElement('searchPage');
const detailPage = getElement('detailPage');
const searchInput = getElement('searchInputMobile');
const searchSubmitBtn = getElement('searchSubmitBtn');
const backgroundMusic = getElement('backgroundMusic');
const topAnimeContainer = getElement('topAnime');
const genreFilter = getElement('genreFilter');
const seasonFilter = getElement('seasonFilter');
const studioFilter = getElement('studioFilter');
const statusFilter = getElement('statusFilter');
const typeFilter = getElement('typeFilter');
const orderByFilter = getElement('orderByFilter');
const filterSearchBtn = getElement('filterSearchBtn');
const backLink = getElement('backLink');
const sidebarToggle = getElement('sidebarToggle');
const filterSidebar = getElement('filterSidebar');
const logo = document.querySelector('.logo');

let isNightMode = false;
let isEffectOn = true;
let isMusicPlaying = false;
let currentPage = 'home';
let currentAnimeId = null;
let previousPage = null;
let lastSearchParams = {};

function init3DBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || !window.THREE) return;
    
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    let particlesMesh = null;
    let snowMesh = null;

    if (isEffectOn) {
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = Math.min(1000, window.innerWidth < 640 ? 500 : 1000);
        const posArray = new Float32Array(particlesCount * 3);
        const colorsArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 8;
            posArray[i + 1] = (Math.random() - 0.5) * 8;
            posArray[i + 2] = (Math.random() - 0.5) * 8;
            const redBase = isNightMode ? 0.4 : 0.6;
            colorsArray[i] = redBase + Math.random() * 0.4;
            colorsArray[i + 1] = Math.random() * 0.1;
            colorsArray[i + 2] = Math.random() * 0.1;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({ 
            size: window.innerWidth < 640 ? 0.02 : 0.015, 
            vertexColors: true, 
            transparent: true, 
            opacity: 0.7 
        });
        particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);
    } else {
        const snowGeometry = new THREE.BufferGeometry();
        const snowCount = Math.min(800, window.innerWidth < 640 ? 400 : 800);
        const snowPosArray = new Float32Array(snowCount * 3);
        const snowVelocities = new Float32Array(snowCount);

        for (let i = 0; i < snowCount * 3; i += 3) {
            snowPosArray[i] = (Math.random() - 0.5) * 15;
            snowPosArray[i + 1] = (Math.random() - 0.5) * 15 + 8;
            snowPosArray[i + 2] = (Math.random() - 0.5) * 15;
            snowVelocities[i / 3] = Math.random() * 0.015 + 0.008;
        }

        snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPosArray, 3));
        snowGeometry.setAttribute('velocity', new THREE.BufferAttribute(snowVelocities, 1));
        const snowMaterial = new THREE.PointsMaterial({ 
            color: 0xFFFFFF, 
            size: window.innerWidth < 640 ? 0.05 : 0.04, 
            transparent: true, 
            opacity: 0.6 
        });
        snowMesh = new THREE.Points(snowGeometry, snowMaterial);
        scene.add(snowMesh);
    }

    camera.position.z = 2;

    function handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);

    function animate() {
        requestAnimationFrame(animate);
        if (isEffectOn && particlesMesh) {
            particlesMesh.rotation.x += 0.0004;
            particlesMesh.rotation.y += 0.0004;
        } else if (!isEffectOn && snowMesh) {
            const positions = snowMesh.geometry.attributes.position.array;
            const velocities = snowMesh.geometry.attributes.velocity.array;
            for (let i = 0; i < snowMesh.geometry.attributes.position.count * 3; i += 3) {
                positions[i + 1] -= velocities[i / 3];
                if (positions[i + 1] < -8) {
                    positions[i + 1] = 8;
                    positions[i] = (Math.random() - 0.5) * 15;
                    positions[i + 2] = (Math.random() - 0.5) * 15;
                }
            }
            snowMesh.geometry.attributes.position.needsUpdate = true;
        }
        renderer.render(scene, camera);
    }
    animate();
}

function toggleMode() {
    isNightMode = !isNightMode;
    document.body.classList.toggle('night-mode', isNightMode);
    document.querySelector('#modeToggle i').className = `fas ${isNightMode ? 'fa-sun' : 'fa-moon'}`;
    init3DBackground();
}

function toggleEffect() {
    isEffectOn = !isEffectOn;
    document.querySelector('#effectToggle i').className = `fas ${isEffectOn ? 'fa-star' : 'fa-snowflake'}`;
    init3DBackground();
}

function toggleMusic() {
    isMusicPlaying = !isMusicPlaying;
    isMusicPlaying ? backgroundMusic.play().catch(err => console.log('Audio playback prevented:', err)) : backgroundMusic.pause();
    document.querySelector('#musicToggle i').className = `fas ${isMusicPlaying ? 'fa-music' : 'fa-volume-mute'}`;
}

async function fetchWithRetry(url, options = {}, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            return await response.json();
        } catch (error) {
            if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
            else throw error;
        }
    }
    throw new Error('Max retry attempts reached');
}

async function fetchWithCache(key, fetchFunction) {
    const now = Date.now();
    if (cache.has(key) && (now - cache.get(key).timestamp < CACHE_DURATION)) return cache.get(key).data;
    try {
        const data = await fetchFunction();
        cache.set(key, { data, timestamp: now });
        return data;
    } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        throw error;
    }
}

async function fetchTrendingAnime() {
    return fetchWithCache('trending', async () => {
        const response = await fetchWithRetry(`${JIKAN_BASE_URL}/top/anime?limit=12&filter=airing`);
        return response.data.map(anime => ({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url,
            rating: anime.score,
            year: anime.year || 'N/A',
            type: anime.type || 'TV'
        }));
    });
}

async function fetchSeasonalAnime() {
    return fetchWithCache('seasonal', async () => {
        const response = await fetchWithRetry(`${JIKAN_BASE_URL}/seasons/now?limit=12`);
        return response.data.map(anime => ({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url,
            rating: anime.score,
            year: anime.year || 'N/A',
            type: anime.type || 'TV'
        }));
    });
}

async function fetchTopAnime(type = 'weekly') {
    const filter = type === 'weekly' ? 'bypopularity' : type === 'monthly' ? 'favorite' : '';
    return fetchWithCache(`top:${type}`, async () => {
        const response = await fetchWithRetry(`${JIKAN_BASE_URL}/top/anime?limit=12${filter ? `&filter=${filter}` : ''}`);
        return response.data.map(anime => ({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url,
            rating: anime.score,
            year: anime.year || 'N/A',
            type: anime.type || 'TV'
        }));
    });
}

async function searchAnime(query, genre = '', season = '', studio = '', status = '', type = '', orderBy = '') {
    return fetchWithCache(`search:${query}:${genre}:${season}:${studio}:${status}:${type}:${orderBy}`, async () => {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (genre) params.append('genres', genre);
        if (season) params.append('season', season);
        if (studio) params.append('producers', studio);
        if (status) params.append('status', status);
        if (type) params.append('type', type);
        if (orderBy) params.append('order_by', orderBy);
        params.append('limit', '24');
        const response = await fetchWithRetry(`${JIKAN_BASE_URL}/anime?${params.toString()}`);
        return response.data.map(anime => ({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url,
            rating: anime.score,
            year: anime.year || 'N/A',
            type: anime.type || 'TV'
        }));
    });
}

async function fetchAnimeDetails(id) {
    return fetchWithCache(`anime:${id}`, async () => {
        try {
            const [detailsRes, charactersRes, recommendationsRes] = await Promise.all([
                fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}`),
                fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}/characters`),
                fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}/recommendations`)
            ]);
            const details = detailsRes.data;
            const characters = charactersRes.data.slice(0, 6);
            const recommendations = recommendationsRes.data.slice(0, 6);
            return {
                id: details.mal_id,
                title: details.title,
                title_japanese: details.title_japanese,
                image: details.images.jpg.large_image_url,
                trailer_url: details.trailer?.youtube_id ? `https://www.youtube.com/embed/${details.trailer.youtube_id}?autoplay=0` : null,
                synopsis: details.synopsis,
                rating: details.score,
                rank: details.rank,
                popularity: details.popularity,
                status: details.status,
                aired: { from: details.aired.from, to: details.aired.to },
                season: details.season,
                year: details.year,
                episodes: details.episodes,
                genres: details.genres.map(g => g.name),
                studios: details.studios.map(s => s.name),
                type: details.type,
                characters: characters.map(c => ({
                    id: c.character.mal_id,
                    name: c.character.name,
                    image: c.character.images.jpg.image_url,
                    role: c.role
                })),
                recommendations: recommendations.map(r => ({
                    id: r.entry.mal_id,
                    title: r.entry.title,
                    image: r.entry.images.jpg.image_url
                }))
            };
        } catch (error) {
            console.error(`Error fetching anime details for ID ${id}:`, error);
            throw error;
        }
    });
}

function createAnimeCard(anime, index) {
    const delay = index * 30;
    const card = document.createElement('div');
    const imageUrl = anime.image || 'https://via.placeholder.com/200x267?text=No+Image';
    card.className = 'anime-card slide-in';
    card.style.animationDelay = `${delay}ms`;
    card.innerHTML = `
        <div class="image-container">
            <img src="${imageUrl}" alt="${anime.title}" class="anime-image" onerror="this.src='https://via.placeholder.com/200x267?text=Error'">
            ${anime.rating ? `<div class="rating">${anime.rating}</div>` : ''}
        </div>
        <div class="card-content">
            <h3 class="anime-title">${anime.title}</h3>
            <div class="anime-info">
                <span>${anime.year || 'N/A'}</span>
                <span>${anime.type || 'Anime'}</span>
            </div>
        </div>
    `;
    card.addEventListener('click', () => {
        previousPage = currentPage;
        currentAnimeId = anime.id;
        showAnimeDetails(anime.id);
    });
    return card;
}

function showHomePage() {
    homePage.classList.remove('hidden');
    searchPage.classList.add('hidden');
    detailPage.classList.add('hidden');
    backLink.classList.add('hidden');
    currentPage = 'home';
    if (window.innerWidth < 768 && filterSidebar) filterSidebar.classList.remove('active');
    document.title = "AnimeVerse - Enhanced";
}

function showSearchPage(query, genre = '', season = '', studio = '', status = '', type = '', orderBy = '') {
    homePage.classList.add('hidden');
    searchPage.classList.remove('hidden');
    detailPage.classList.add('hidden');
    backLink.classList.remove('hidden');
    currentPage = 'search';
    lastSearchParams = { query, genre, season, studio, status, type, orderBy };
    if (window.innerWidth < 768 && filterSidebar) filterSidebar.classList.remove('active');
    const pageTitle = query ? `Search: ${query}` : 'Advanced Search';
    document.title = `${pageTitle} - AnimeVerse`;
    if (searchPage.querySelector('.section-title')) searchPage.querySelector('.section-title').textContent = pageTitle;
    searchResultsContainer.innerHTML = '<div class="loading">Loading results...</div>';
    searchAnime(query, genre, season, studio, status, type, orderBy).then(results => {
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `
                <div class="text-center py-6 w-full">
                    <p class="text-xl">No results found${query ? ` for "${query}"` : ''}</p>
                    <p class="mt-2 text-gray-400">Try a different search term or filters</p>
                </div>
            `;
            return;
        }
        results.forEach((anime, index) => searchResultsContainer.appendChild(createAnimeCard(anime, index)));
    }).catch(error => {
        searchResultsContainer.innerHTML = `
            <div class="text-center py-6 w-full">
                <p class="text-xl">Error fetching search results</p>
                <p class="mt-2 text-gray-400">${error.message}</p>
            </div>
        `;
    });
    window.scrollTo(0, 0);
}

function showAnimeDetails(id) {
    homePage.classList.add('hidden');
    searchPage.classList.add('hidden');
    detailPage.classList.remove('hidden');
    backLink.classList.remove('hidden');
    currentPage = 'detail';
    currentAnimeId = id;
    if (window.innerWidth < 768 && filterSidebar) filterSidebar.classList.remove('active');
    const detailTitle = getElement('detailTitle');
    const detailJapanese = getElement('detailJapanese');
    const detailImage = getElement('detailImage');
    const detailRating = getElement('detailRating');
    const detailRank = getElement('detailRank');
    const detailPopularity = getElement('detailPopularity');
    const detailType = getElement('detailType');
    const detailEpisodes = getElement('detailEpisodes');
    const detailStatus = getElement('detailStatus');
    const detailAired = getElement('detailAired');
    const detailSeason = getElement('detailSeason');
    const detailStudios = getElement('detailStudios');
    const detailGenres = getElement('detailGenres');
    const detailSynopsis = getElement('detailSynopsis');
    const charactersList = getElement('charactersList');
    const trailerEmbed = getElement('trailerEmbed');
    const recommendationsList = getElement('recommendationsList');
    detailTitle.textContent = 'Loading...';
    detailJapanese.textContent = '';
    detailImage.src = '';
    detailRating.textContent = 'N/A';
    detailRank.textContent = 'N/A';
    detailPopularity.textContent = 'N/A';
    detailType.textContent = 'N/A';
    detailEpisodes.textContent = 'N/A';
    detailStatus.textContent = 'N/A';
    detailAired.textContent = 'N/A';
    detailSeason.textContent = 'N/A';
    detailStudios.textContent = 'N/A';
    detailGenres.textContent = 'N/A';
    detailSynopsis.textContent = 'Loading synopsis...';
    charactersList.innerHTML = '';
    trailerEmbed.innerHTML = `<div class="trailer-placeholder"><p>Loading trailer...</p></div>`;
    recommendationsList.innerHTML = '';
    window.scrollTo(0, 0);
    fetchAnimeDetails(id).then(anime => {
        document.title = `${anime.title} - AnimeVerse`;
        detailTitle.textContent = anime.title;
        detailJapanese.textContent = anime.title_japanese || '';
        detailImage.src = anime.image;
        detailRating.textContent = anime.rating || 'N/A';
        detailRank.textContent = anime.rank || 'N/A';
        detailPopularity.textContent = anime.popularity || 'N/A';
        detailType.textContent = anime.type || 'N/A';
        detailEpisodes.textContent = anime.episodes || 'N/A';
        detailStatus.textContent = anime.status || 'N/A';
        const airedFrom = anime.aired.from ? new Date(anime.aired.from).toLocaleDateString() : '?';
        const airedTo = anime.aired.to ? new Date(anime.aired.to).toLocaleDateString() : '?';
        detailAired.textContent = `${airedFrom} to ${airedTo}`;
        const seasonText = anime.season && anime.year ? `${anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} ${anime.year}` : 'N/A';
        detailSeason.textContent = seasonText;
        detailStudios.textContent = anime.studios.length > 0 ? anime.studios.join(', ') : 'N/A';
        detailGenres.textContent = anime.genres.length > 0 ? anime.genres.join(', ') : 'N/A';
        detailSynopsis.textContent = anime.synopsis || 'No synopsis available';
        charactersList.innerHTML = '';
        if (anime.characters.length > 0) {
            anime.characters.forEach(character => {
                const charCard = document.createElement('div');
                charCard.className = 'character-card';
                charCard.innerHTML = `
                    <img src="${character.image}" alt="${character.name}" class="character-image" onerror="this.src='https://via.placeholder.com/100x100?text=?'">
                    <div class="character-name">${character.name}<span class="character-role">${character.role}</span></div>
                `;
                charactersList.appendChild(charCard);
            });
        } else {
            charactersList.innerHTML = '<p class="text-center w-full">No character information available</p>';
        }
        trailerEmbed.innerHTML = anime.trailer_url ? `<iframe src="${anime.trailer_url}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>` : `<div class="trailer-placeholder"><p>No trailer available</p></div>`;
        recommendationsList.innerHTML = '';
        if (anime.recommendations.length > 0) {
            anime.recommendations.forEach((rec, index) => recommendationsList.appendChild(createAnimeCard({ id: rec.id, title: rec.title, image: rec.image, type: 'Anime' }, index)));
        } else {
            recommendationsList.innerHTML = '<p class="text-center w-full">No recommendations available</p>';
        }
    }).catch(error => {
        console.error('Error loading anime details:', error);
        detailPage.innerHTML = `
            <div class="text-center py-6">
                <p class="text-xl">Error loading anime details</p>
                <p class="mt-2 text-gray-400">${error.message || 'Unknown error'}</p>
                <button class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" onclick="goBack()"><i class="fas fa-arrow-left mr-2"></i>Back</button>
            </div>
        `;
    });
}

function setupTabButtons() {
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const tab = button.getAttribute('data-tab');
                topAnimeContainer.innerHTML = '<div class="loading">Loading...</div>';
                fetchTopAnime(tab).then(animeList => {
                    topAnimeContainer.innerHTML = '';
                    animeList.forEach((anime, index) => topAnimeContainer.appendChild(createAnimeCard(anime, index)));
                }).catch(error => {
                    topAnimeContainer.innerHTML = `
                        <div class="text-center py-4 w-full">
                            <p>Error loading top anime</p>
                            <p class="mt-2 text-gray-400">${error.message}</p>
                        </div>
                    `;
                });
            });
        });
    }
}

function goBack() {
    if (currentPage === 'detail' && previousPage === 'search') {
        showSearchPage(lastSearchParams.query, lastSearchParams.genre, lastSearchParams.season, lastSearchParams.studio, lastSearchParams.status, lastSearchParams.type, lastSearchParams.orderBy);
    } else if (currentPage === 'detail' && previousPage === 'home') {
        showHomePage();
    } else if (currentPage === 'search' && previousPage === 'home') {
        showHomePage();
    } else if (currentPage === 'detail' && previousPage === 'detail' && currentAnimeId) {
        showAnimeDetails(currentAnimeId);
    } else {
        showHomePage();
    }
}

window.goBack = goBack;

function toggleSidebar() {
    filterSidebar.classList.toggle('active');
}

async function initApp() {
    init3DBackground();
    const modeToggle = getElement('modeToggle');
    const effectToggle = getElement('effectToggle');
    const musicToggle = getElement('musicToggle');
    if (modeToggle) modeToggle.addEventListener('click', toggleMode);
    if (effectToggle) effectToggle.addEventListener('click', toggleEffect);
    if (musicToggle) musicToggle.addEventListener('click', toggleMusic);
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (logo) logo.addEventListener('click', (e) => {
        e.preventDefault();
        previousPage = currentPage;
        showHomePage();
    });
    if (searchSubmitBtn && searchInput) {
        searchSubmitBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                previousPage = currentPage;
                showSearchPage(query);
            }
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    previousPage = currentPage;
                    showSearchPage(query);
                }
            }
        });
    }
    if (filterSearchBtn) {
        filterSearchBtn.addEventListener('click', () => {
            const query = searchInput ? searchInput.value.trim() : '';
            const genre = genreFilter ? genreFilter.value : '';
            const season = seasonFilter ? seasonFilter.value : '';
            const studio = studioFilter ? studioFilter.value : '';
            const status = statusFilter ? statusFilter.value : '';
            const type = typeFilter ? typeFilter.value : '';
            const orderBy = orderByFilter ? orderByFilter.value : '';
            previousPage = currentPage;
            showSearchPage(query, genre, season, studio, status, type, orderBy);
        });
    }
    if (backLink) backLink.addEventListener('click', (e) => {
        e.preventDefault();
        goBack();
    });
    setupTabButtons();
    try {
        trendingAnimeContainer.innerHTML = '<div class="loading">Loading trending anime...</div>';
        seasonalAnimeContainer.innerHTML = '<div class="loading">Loading seasonal anime...</div>';
        topAnimeContainer.innerHTML = '<div class="loading">Loading top anime...</div>';
        const [trending, seasonal, top] = await Promise.all([fetchTrendingAnime(), fetchSeasonalAnime(), fetchTopAnime('weekly')]);
        trendingAnimeContainer.innerHTML = '';
        trending.forEach((anime, index) => trendingAnimeContainer.appendChild(createAnimeCard(anime, index)));
        seasonalAnimeContainer.innerHTML = '';
        seasonal.forEach((anime, index) => seasonalAnimeContainer.appendChild(createAnimeCard(anime, index)));
        topAnimeContainer.innerHTML = '';
        top.forEach((anime, index) => topAnimeContainer.appendChild(createAnimeCard(anime, index)));
    } catch (error) {
        console.error('Error loading initial data:', error);
        homePage.innerHTML = `
            <div class="text-center py-6">
                <p class="text-xl">Error loading initial data</p>
                <p class="mt-2 text-gray-400">${error.message}</p>
                <button class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', initApp);