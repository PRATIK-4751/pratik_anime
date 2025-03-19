const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const KITSU_BASE_URL = 'https://kitsu.io/api/edge';

const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 5;

const showLoading = () => {
    console.log('Showing loading indicator');
};

const hideLoading = () => {
    console.log('Hiding loading indicator');
};

const initialLoading = document.getElementById('initialLoading');
function hideInitialLoading() {
    initialLoading.classList.add('hidden');
}

const modeToggle = document.getElementById('modeToggle');
const musicToggle = document.getElementById('musicToggle');
const backgroundMusic = document.getElementById('backgroundMusic');
let isNightMode = false;
let isMusicPlaying = true;

backgroundMusic.play();

function toggleMode() {
    isNightMode = !isNightMode;
    document.body.classList.toggle('night-mode', isNightMode);
    document.body.classList.toggle('day-mode', !isNightMode);
    modeToggle.innerHTML = isNightMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    if (isNightMode) {
        initStarfield();
        document.querySelectorAll('.snowflake').forEach(s => s.remove());
    } else {
        createSnowflakes();
        if (starfieldCanvas) starfieldCanvas.remove();
    }
}

function toggleMusic() {
    isMusicPlaying = !isMusicPlaying;
    if (isMusicPlaying) {
        backgroundMusic.play();
        musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
        backgroundMusic.pause();
        musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
}

modeToggle.addEventListener('click', toggleMode);
musicToggle.addEventListener('click', toggleMusic);

function createSnowflakes() {
    for (let i = 0; i < 100; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = Math.random() * 5 + 5 + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowflake.style.opacity = Math.random();
        document.body.appendChild(snowflake);
    }
}

let starfieldCanvas;
function initStarfield() {
    if (starfieldCanvas) starfieldCanvas.remove();
    starfieldCanvas = document.createElement('canvas');
    starfieldCanvas.id = 'starfield';
    document.body.appendChild(starfieldCanvas);
    const ctx = starfieldCanvas.getContext('2d');
    starfieldCanvas.width = window.innerWidth;
    starfieldCanvas.height = window.innerHeight;
    const stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * starfieldCanvas.width,
            y: Math.random() * starfieldCanvas.height,
            z: Math.random() * starfieldCanvas.width,
            speed: Math.random() * 0.5 + 0.5
        });
    }
    function animateStars() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
        stars.forEach(star => {
            star.z -= star.speed;
            if (star.z <= 0) {
                star.z = starfieldCanvas.width;
                star.x = Math.random() * starfieldCanvas.width;
                star.y = Math.random() * starfieldCanvas.height;
            }
            const x = (star.x - starfieldCanvas.width / 2) * (starfieldCanvas.width / star.z) + starfieldCanvas.width / 2;
            const y = (star.y - starfieldCanvas.height / 2) * (starfieldCanvas.width / starfieldCanvas.height) + starfieldCanvas.height / 2;
            const size = starfieldCanvas.width / star.z;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animateStars);
    }
    animateStars();
    window.addEventListener('resize', () => {
        starfieldCanvas.width = window.innerWidth;
        starfieldCanvas.height = window.innerHeight;
    });
}

async function fetchWithCache(url) {
    if (cache.has(url)) {
        const { data, timestamp } = cache.get(url);
        if (Date.now() - timestamp < CACHE_DURATION) {
            return data;
        }
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cache.set(url, { data, timestamp: Date.now() });
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

const slideshowImages = [
    'https://external-preview.redd.it/Dx7kym02QCFgvV3zZSCWM-1kPXwcgoCdEzFVCDvan8k.jpg?width=640&crop=smart&auto=webp&s=c9f301b489d28450bc46ef1528fd3183b4a861ad',
    'https://wallpapercave.com/wp/wp6942316.jpg',
    'https://images6.alphacoders.com/940/thumb-1920-940473.jpg',
    'https://external-preview.redd.it/nEdjjB9-QmYr6y99INRSvttOaZ539_gEayDfUw1b2x0.jpg?auto=webp&s=6c57ff7fcb3d980a7ea3c09583b89b71f137c1f7'
];

const initialSlideshowData = [
    { 
        title: 'Berserk', 
        subtitle: '', 
        synopsis: 'Guts, a mercenary, joins the Band of the Hawk after being defeated by its leader, Griffith. Together, they fight in the kingdom of Midland, but dark forces conspire against them.' 
    },
    { 
        title: 'Monster', 
        subtitle: '', 
        synopsis: 'Dr. Kenzo Tenma, a skilled neurosurgeon, saves a young boy named Johan Liebert, only to discover years later that Johan has become a dangerous psychopath, forcing Tenma to confront the consequences of his decision.' 
    },
    { 
        title: 'Fairy Tail', 
        subtitle: '', 
        synopsis: 'Lucy, a young wizard, joins the Fairy Tail guild and teams up with Natsu Dragneel, a fire-breathing wizard, as they embark on adventures and battle dark forces threatening their world.' 
    },
    { 
        title: 'Bleach', 
        subtitle: '', 
        synopsis: 'Ichigo Kurosaki gains the powers of a Soul Reaper and must protect the living world from evil spirits while guiding departed souls to the afterlife, facing greater threats as his journey unfolds.' 
    }
];

let slideshowData = [...initialSlideshowData];
let dynamicSlideshowImages = [...slideshowImages];
let currentSlide = 0;

async function fetchAdditionalSlides() {
    try {
        showLoading();
        const jikanData = await fetchWithCache(`${JIKAN_BASE_URL}/top/anime?filter=airing`);
        const kitsuData = await fetchWithCache(`${KITSU_BASE_URL}/trending/anime`);
        const additionalAnimes = mergeSources(jikanData?.data || [], kitsuData?.data || []);
        const additionalSlides = additionalAnimes.slice(0, 3).map(anime => {
            const titleParts = (anime.title || 'Untitled').split(':');
            return {
                title: titleParts[0].trim(),
                subtitle: titleParts[1] ? titleParts[1].trim() : '',
                synopsis: anime.synopsis || 'No synopsis available.',
                images: {
                    jpg: { 
                        image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://via.placeholder.com/1200x400'
                    }
                },
                score: anime.score || 0,
                type: anime.type || 'TV',
                status: anime.status || 'Unknown',
                genres: anime.genres?.map(g => g.name).join(', ') || 'Unknown'
            };
        });
        additionalSlides.forEach(slide => {
            slideshowData.push({
                title: slide.title,
                subtitle: slide.subtitle,
                synopsis: slide.synopsis
            });
            dynamicSlideshowImages.push(slide.images.jpg.image_url);
        });
    } catch (error) {
        console.error('Error fetching additional slides:', error);
    } finally {
        hideLoading();
    }
}

function startSlideshow() {
    const heroSection = document.getElementById('hero');
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroSynopsis = document.getElementById('heroSynopsis');
    const watchNowBtn = document.getElementById('watchNowBtn');
    function updateSlide() {
        const slide = slideshowData[currentSlide];
        heroSection.style.backgroundImage = `url('${dynamicSlideshowImages[currentSlide]}')`;
        heroTitle.textContent = slide.title;
        heroSubtitle.textContent = slide.subtitle;
        heroSynopsis.textContent = slide.synopsis.substring(0, 150) + '...';
        watchNowBtn.onclick = () => showAnimeDetails(slide);
        currentSlide = (currentSlide + 1) % slideshowData.length;
    }
    fetchAdditionalSlides().then(() => {
        updateSlide();
        setInterval(updateSlide, 5000);
    });
}

async function performAdvancedSearch() {
    const season = document.getElementById('seasonSelect').value;
    const genre = document.getElementById('genreSelect').value;
    const studio = document.getElementById('studioSelect').value;
    const status = document.getElementById('statusSelect').value;
    const type = document.getElementById('typeSelect').value;
    const order = document.getElementById('orderSelect').value;
    try {
        showLoading();
        let jikanUrl = `${JIKAN_BASE_URL}/anime?`;
        let kitsuUrl = `${KITSU_BASE_URL}/anime?`;
        const jikanParams = [];
        if (season) jikanParams.push(`season=${season}`);
        if (genre) jikanParams.push(`genres=${genre}`);
        if (studio) jikanParams.push(`producers=${studio}`);
        if (status) jikanParams.push(`status=${status}`);
        if (type) jikanParams.push(`type=${type}`);
        if (order) {
            if (order === 'score') jikanParams.push(`sort=desc`);
            else if (order === 'popularity') jikanParams.push(`sort=popularity`);
            else if (order === 'trending') jikanParams.push(`sort=trending`);
            else if (order === 'recently') jikanParams.push(`sort=start_date`);
        }
        jikanUrl += jikanParams.join('&');
        const kitsuParams = [];
        if (season) kitsuParams.push(`filter[season]=${season}`);
        if (genre) kitsuParams.push(`filter[categories]=${genre}`);
        if (status) kitsuParams.push(`filter[status]=${status}`);
        if (type) kitsuParams.push(`filter[subtype]=${type}`);
        if (order) {
            if (order === 'score') kitsuParams.push(`sort=-averageRating`);
            else if (order === 'popularity') kitsuParams.push(`sort=-userCount`);
            else if (order === 'trending') kitsuParams.push(`sort=-trending`);
            else if (order === 'recently') kitsuParams.push(`sort=-startDate`);
        }
        kitsuUrl += kitsuParams.join('&');
        let jikanResults, kitsuResults;
        if (order === 'trending') {
            jikanResults = await fetchWithCache(`${JIKAN_BASE_URL}/top/anime?filter=airing`);
            kitsuResults = await fetchWithCache(`${KITSU_BASE_URL}/trending/anime`);
        } else if (order === 'recently') {
            jikanResults = await fetchWithCache(`${JIKAN_BASE_URL}/anime?sort=start_date`);
            kitsuResults = await fetchWithCache(`${KITSU_BASE_URL}/anime?sort=-startDate`);
        } else {
            [jikanResults, kitsuResults] = await Promise.all([
                fetchWithCache(jikanUrl),
                fetchWithCache(kitsuUrl)
            ]);
        }
        const combinedResults = mergeSources(jikanResults?.data || [], kitsuResults?.data || []);
        document.querySelectorAll('section').forEach(s => s.classList.remove('active-section'));
        const searchResultsSection = document.getElementById('search-results');
        searchResultsSection.classList.add('active-section');
        const container = document.getElementById('searchResults');
        container.innerHTML = '';
        if (combinedResults.length === 0) {
            container.innerHTML = '<p>No results found.</p>';
        } else {
            combinedResults.forEach(anime => {
                const card = createAnimeCard(anime);
                container.appendChild(card);
            });
            searchResultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error performing advanced search:', error);
        const container = document.getElementById('searchResults');
        container.innerHTML = '<p>Error loading search results. Please try again later.</p>';
        document.querySelectorAll('section').forEach(s => s.classList.remove('active-section'));
        document.getElementById('search-results').classList.add('active-section');
    } finally {
        hideLoading();
    }
}

document.getElementById('applyFilters').addEventListener('click', () => {
    performAdvancedSearch();
});

async function fetchCombinedData(type) {
    try {
        showLoading();
        let jikanData, kitsuData;
        switch (type) {
            case 'trending':
                jikanData = await fetchWithCache(`${JIKAN_BASE_URL}/top/anime?filter=airing`);
                kitsuData = await fetchWithCache(`${KITSU_BASE_URL}/trending/anime`);
                break;
            case 'popular':
                jikanData = await fetchWithCache(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity`);
                kitsuData = await fetchWithCache(`${KITSU_BASE_URL}/anime?sort=-userCount`);
                break;
            case 'weekly':
                jikanData = await fetchWithCache(`${JIKAN_BASE_URL}/top/anime?filter=airing`);
                kitsuData = await fetchWithCache(`${KITSU_BASE_URL}/trending/anime`);
                break;
            case 'monthly':
                jikanData = await fetchWithCache(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity`);
                kitsuData = await fetchWithCache(`${KITSU_BASE_URL}/anime?sort=-userCount`);
                break;
            case 'all':
                jikanData = await fetchWithCache(`${JIKAN_BASE_URL}/top/anime`);
                kitsuData = await fetchWithCache(`${KITSU_BASE_URL}/anime?sort=-averageRating`);
                break;
            default:
                throw new Error('Invalid type');
        }
        return mergeSources(jikanData?.data || [], kitsuData?.data || []);
    } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
        return [];
    } finally {
        hideLoading();
    }
}

function mergeSources(jikanAnimes, kitsuAnimes) {
    const combined = [];
    jikanAnimes.forEach(anime => {
        const titleParts = (anime.title || 'Untitled').split(':');
        combined.push({
            title: titleParts[0].trim(),
            subtitle: titleParts[1] ? titleParts[1].trim() : '',
            images: {
                jpg: { 
                    image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://via.placeholder.com/1200x400'
                }
            },
            score: anime.score || 0,
            synopsis: anime.synopsis || 'No synopsis available.',
            type: anime.type || 'TV',
            status: anime.status || 'Unknown',
            genres: anime.genres?.map(g => g.name).join(', ') || 'Unknown'
        });
    });
    kitsuAnimes.forEach(kitsuAnime => {
        const title = kitsuAnime.attributes?.canonicalTitle || 'Untitled';
        const titleParts = title.split(':');
        if (!combined.some(anime => anime.title.toLowerCase() === title.toLowerCase())) {
            combined.push({
                title: titleParts[0].trim(),
                subtitle: titleParts[1] ? titleParts[1].trim() : '',
                images: {
                    jpg: { 
                        image_url: kitsuAnime.attributes?.coverImage?.original || kitsuAnime.attributes?.posterImage?.original || 'https://via.placeholder.com/1200x400'
                    }
                },
                score: (kitsuAnime.attributes?.averageRating || 0) / 10,
                synopsis: kitsuAnime.attributes?.synopsis || 'No synopsis available.',
                type: kitsuAnime.attributes?.subtype || 'TV',
                status: kitsuAnime.attributes?.status || 'Unknown',
                genres: kitsuAnime.attributes?.categories?.join(', ') || 'Unknown'
            });
        }
    });
    return combined;
}

function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.innerHTML = `
        <div class="type-tag">${anime.type}</div>
        <div class="status-tag">${anime.status}</div>
        <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
        <div class="anime-info">
            <h3>${anime.title}${anime.subtitle ? ': ' + anime.subtitle : ''}</h3>
        </div>
    `;
    card.addEventListener('click', () => showAnimeDetails(anime));
    return card;
}

function createTopAnimeItem(anime, index) {
    const item = document.createElement('div');
    item.className = 'top-anime';
    item.innerHTML = `
        <span class="rank">${index + 1}</span>
        <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
        <div class="top-anime-info">
            <h4>${anime.title}${anime.subtitle ? ': ' + anime.subtitle : ''}</h4>
            <p>Genres: ${anime.genres}</p>
            <div class="rating">
                <i class="fas fa-star"></i>
                ${(anime.score || 0).toFixed(1)}
            </div>
        </div>
    `;
    return item;
}

function showAnimeDetails(anime) {
    const modal = document.getElementById('animeModal');
    const modalContent = document.getElementById('modalContent');
    const slideIndex = slideshowData.findIndex(slide => slide.title === anime.title && slide.subtitle === anime.subtitle);
    const imageUrl = slideIndex !== -1 ? dynamicSlideshowImages[slideIndex] : (anime.images?.jpg?.image_url || 'https://via.placeholder.com/1200x400');
    modalContent.innerHTML = `
        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
            <img src="${imageUrl}" alt="${anime.title}" 
                 style="max-width: 300px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);">
            <div>
                <h2 style="color: var(--accent-color); margin-bottom: 1rem;">${anime.title}${anime.subtitle ? ': ' + anime.subtitle : ''}</h2>
                <p style="margin: 1rem 0; color: var(--text-color);">${anime.synopsis}</p>
                <p style="margin: 0.5rem 0; color: var(--text-color);">Type: ${anime.type || 'TV'}</p>
                <p style="margin: 0.5rem 0; color: var(--text-color);">Status: ${anime.status || 'Unknown'}</p>
                <p style="margin: 0.5rem 0; color: var(--text-color);">Genres: ${anime.genres || 'Unknown'}</p>
                <div class="rating" style="font-size: 1.2rem;">
                    <i class="fas fa-star"></i>
                    ${(anime.score || 0).toFixed(1)}
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}

document.querySelector('.close').addEventListener('click', () => {
    const modal = document.getElementById('animeModal');
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.opacity = '1';
    }, 300);
});

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

async function performSearch(query) {
    try {
        showLoading();
        let combinedResults = [];
        if (query.toLowerCase() === 'jujutsu kaisen') {
            const specificTitles = ['berserk', 'monster', 'fairy tail', 'bleach'];
            const searchPromises = specificTitles.map(title =>
                Promise.all([
                    fetchWithCache(`${JIKAN_BASE_URL}/anime?q=${title}`),
                    fetchWithCache(`${KITSU_BASE_URL}/anime?filter[text]=${title}`)
                ])
            );
            const results = await Promise.all(searchPromises);
            results.forEach(([jikanResults, kitsuResults], index) => {
                const merged = mergeSources(jikanResults?.data || [], kitsuResults?.data || []);
                const anime = merged.find(a => a.title.toLowerCase() === specificTitles[index].toLowerCase());
                if (anime) combinedResults.push(anime);
            });
        } else {
            const [jikanResults, kitsuResults] = await Promise.all([
                fetchWithCache(`${JIKAN_BASE_URL}/anime?q=${query}`),
                fetchWithCache(`${KITSU_BASE_URL}/anime?filter[text]=${query}`)
            ]);
            combinedResults = mergeSources(jikanResults?.data || [], kitsuResults?.data || []);
        }
        document.querySelectorAll('section').forEach(s => s.classList.remove('active-section'));
        const searchResultsSection = document.getElementById('search-results');
        searchResultsSection.classList.add('active-section');
        const container = document.getElementById('searchResults');
        container.innerHTML = combinedResults.length ? '' : '<p>No results found.</p>';
        combinedResults.forEach(anime => container.appendChild(createAnimeCard(anime)));
        searchResultsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error searching:', error);
        document.getElementById('searchResults').innerHTML = '<p>Error loading search results.</p>';
        document.querySelectorAll('section').forEach(s => s.classList.remove('active-section'));
        document.getElementById('search-results').classList.add('active-section');
    } finally {
        hideLoading();
    }
}

searchBtn.addEventListener('click', () => {
    if (searchInput.value.trim()) performSearch(searchInput.value.trim());
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) performSearch(searchInput.value.trim());
});

document.querySelectorAll('.ranking-tabs .tab').forEach(tab => {
    tab.addEventListener('click', async (e) => {
        document.querySelectorAll('.ranking-tabs .tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const type = e.target.dataset.tab;
        const data = await fetchCombinedData(type);
        const container = document.getElementById('topAnimeList');
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<p>No data available.</p>';
        } else {
            data.slice(0, 5).forEach((anime, index) => container.appendChild(createTopAnimeItem(anime, index)));
        }
    });
});

async function initializeHomePage() {
    try {
        const [trending, popular, weekly] = await Promise.all([
            fetchCombinedData('trending'),
            fetchCombinedData('popular'),
            fetchCombinedData('weekly')
        ]);
        startSlideshow();
        const popularContainer = document.getElementById('popularTodayAnime');
        popular.slice(0, 10).forEach(anime => popularContainer.appendChild(createAnimeCard(anime)));
        const topAnimeContainer = document.getElementById('topAnimeList');
        weekly.slice(0, 5).forEach((anime, index) => topAnimeContainer.appendChild(createTopAnimeItem(anime, index)));
    } catch (error) {
        console.error('Error initializing home page:', error);
    } finally {
        setTimeout(hideInitialLoading, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('day-mode');
    createSnowflakes();
    initializeHomePage();
});