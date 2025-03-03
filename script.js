document.addEventListener('DOMContentLoaded', function() {
    const stationInput = document.getElementById('station-input');
    const searchBtn = document.getElementById('search-btn');
    const departuresList = document.getElementById('departures-list');
    const suggestionsDropdown = document.getElementById('station-suggestions');
    
    // Timer variable to store the interval reference
    let updateTimer = null;
    
    // Set default value for the input field
    stationInput.value = 'Zürich HB';
    
    // Default station to show when the page loads
    fetchDepartures('Zürich HB');
    
    // Add event listener for input changes to show suggestions
    stationInput.addEventListener('input', function() {
        const query = stationInput.value.trim();
        if (query.length >= 2) {
            fetchStationSuggestions(query);
        } else {
            suggestionsDropdown.style.display = 'none';
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!stationInput.contains(e.target) && !suggestionsDropdown.contains(e.target)) {
            suggestionsDropdown.style.display = 'none';
        }
    });
    
    searchBtn.addEventListener('click', function() {
        const station = stationInput.value.trim();
        if (station) {
            fetchDepartures(station);
            suggestionsDropdown.style.display = 'none';
        }
    });
    
    stationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const station = stationInput.value.trim();
            if (station) {
                fetchDepartures(station);
                suggestionsDropdown.style.display = 'none';
            }
        }
    });
    
    // Function to fetch station suggestions
    function fetchStationSuggestions(query) {
        const apiUrl = `https://transport.opendata.ch/v1/locations?query=${encodeURIComponent(query)}&type=station`;
        
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                displaySuggestions(data.stations);
            })
            .catch(error => {
                console.error('Error fetching suggestions:', error);
            });
    }
    
    // Function to display suggestions in the dropdown
    function displaySuggestions(stations) {
        suggestionsDropdown.innerHTML = '';
        
        if (stations && stations.length > 0) {
            stations.slice(0, 10).forEach(station => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = station.name;
                
                item.addEventListener('click', function() {
                    stationInput.value = station.name;
                    suggestionsDropdown.style.display = 'none';
                    fetchDepartures(station.name);
                });
                
                suggestionsDropdown.appendChild(item);
            });
            
            suggestionsDropdown.style.display = 'block';
        } else {
            suggestionsDropdown.style.display = 'none';
        }
    }
    
    function fetchDepartures(station) {
        // Clear any existing timer
        if (updateTimer) {
            clearInterval(updateTimer);
        }
        
        // The Swiss public transport API URL
        // Documentation: https://transport.opendata.ch/docs.html
        const apiUrl = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(station)}&limit=4`;
        
        departuresList.innerHTML = '<p class="loading">Daten werden geladen...</p>';
        
        // Function to fetch and update data
        function fetchAndUpdate() {
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    console.log("API response:", data);
                    displayDepartures(data, station);
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    departuresList.innerHTML = '<p class="error">Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.</p>';
                });
        }
        
        // Initial fetch
        fetchAndUpdate();
        
        // Set up timer to update every minute (60000 milliseconds)
        updateTimer = setInterval(fetchAndUpdate, 60000);
    }
    
    function displayDepartures(data, stationName) {
        departuresList.innerHTML = '';
        
        if (!data.stationboard || data.stationboard.length === 0) {
            departuresList.innerHTML += '<p>Keine Abfahrten gefunden.</p>';
            return;
        }
        
        // Take only the first 4 departures
        const departures = data.stationboard.slice(0, 4);
        
        // Process each departure
        departures.forEach(departure => {
            const departureRow = document.createElement('div');
            departureRow.className = 'departure-row';
            
            const lineNumber = document.createElement('div');
            lineNumber.className = 'line-number';
            
            // Format line number (remove leading zeros and limit length if necessary)
            let formattedNumber = departure.number;
            if (formattedNumber.match(/^0+/)) {
                // Remove leading zeros
                formattedNumber = formattedNumber.replace(/^0+/, '');
            }
            lineNumber.textContent = formattedNumber;
            
            const destination = document.createElement('div');
            destination.className = 'destination';
            destination.textContent = departure.to;
            
            const departureInfo = document.createElement('div');
            departureInfo.className = 'departure-info';
            
            // Calculate minutes until departure
            const departureDate = new Date(departure.stop.departure);
            const now = new Date();
            const minutesUntil = Math.floor((departureDate - now) / 60000);
            
            const departureTime = document.createElement('span');
            departureTime.className = 'departure-time';
            
            if (minutesUntil <= 0) {
                departureTime.textContent = 'jetzt';
            } else {
                departureTime.textContent = `${minutesUntil}'`;
            }
            
            const delayMinutes = Math.floor(departure.stop.delay / 60);
            if (delayMinutes > 0) {
                departureTime.textContent = `${minutesUntil}' (+${delayMinutes}')`;
                departureTime.classList.add('delayed');
            }
            
            departureInfo.appendChild(departureTime);
            
            departureRow.appendChild(lineNumber);
            departureRow.appendChild(destination);
            departureRow.appendChild(departureInfo);
            
            departuresList.appendChild(departureRow);
        });
        
        // Update timestamp outside of the departures list
        const updateInfoContainer = document.getElementById('update-info-container');
        updateInfoContainer.textContent = `Letzte Aktualisierung: ${new Date().toLocaleTimeString()}`;
    }
}); 