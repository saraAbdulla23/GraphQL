const GRAPHQL_API = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

        async function fetchUserDetails() {
            const query = `query {
                user {
                    id
                    login
                    email
                    campus
                    profile
                    lastName
                    firstName
                    auditRatio
                    totalUp
                    totalDown
                    timeline: transactions(
                        where: {type: {_eq: "xp"}, _or: [{attrs: {_eq: {}}}, {attrs: {_has_key: "group"}}], _and: [{path: {_nlike: "%/piscine-js/%"}}, {path: {_nlike: "%/piscine-go/%"}}]}
                    ) {
                        amount
                        createdAt
                        path
                    }
                }
            }`;

            const response = await fetch(GRAPHQL_API, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });
            const data = await response.json();
            return data.data.user[0];
        }

        async function renderUserProfile() {
    const user = await fetchUserDetails();

    document.getElementById("fullName").innerText = `Welcome ${user.firstName} ${user.lastName}`;
    document.getElementById("email").innerText = `Email: ${user.email}`;
    document.getElementById("campus").innerText = `Campus: ${user.campus}`;

    // Update the ratio values
    document.getElementById("totalUpValue").innerText = user.totalUp; // Set Done Audits value
    document.getElementById("totalDownValue").innerText = user.totalDown; // Set Received Audits value

    renderAuditRatioGraph(user.totalUp, user.totalDown);
    fetchAuditsGiven(user.id); // Fetch audits for pie chart
}


        function renderAuditRatioGraph(totalUp, totalDown) {
            const total = totalUp + totalDown;
            const upPercentage = (totalUp / total) * 100;
            const downPercentage = (totalDown / total) * 100;

            const svg = d3.select("#auditRatioContainer").append("svg")
                .attr("width", 120)
                .attr("height", 120);

            const radius = 50;

            svg.append("circle")
                .attr("cx", 60)
                .attr("cy", 60)
                .attr("r", radius)
                .attr("stroke", "red")
                .attr("stroke-width", 10)
                .attr("fill", "none");

            svg.append("circle")
                .attr("cx", 60)
                .attr("cy", 60)
                .attr("r", radius)
                .attr("stroke", "red")
                .attr("stroke-width", 10)
                .attr("fill", "none")
                .attr("stroke-dasharray", `${(2 * Math.PI * radius * downPercentage) / 100} ${2 * Math.PI * radius}`)
                .attr("transform", "rotate(-90 60 60)");

            svg.append("circle")
                .attr("cx", 60)
                .attr("cy", 60)
                .attr("r", radius)
                .attr("stroke", "#4CAF50")
                .attr("stroke-width", 10)
                .attr("fill", "none")
                .attr("stroke-dasharray", `${(2 * Math.PI * radius * upPercentage) / 100} ${2 * Math.PI * radius}`)
                .attr("transform", "rotate(-90 60 60)");

            svg.append("text")
                .attr("x", "50%")
                .attr("y", "50%")
                .attr("text-anchor", "middle")
                .attr("dy", ".35em")
                .attr("font-size", "18")
                .attr("fill", "#4CAF50")
                .text((totalUp / totalDown).toFixed(2));
        }

        async function fetchAuditsGiven(userid) {
            const query = `
                query FetchAudits($userid: Int!) {
                    audit(where: {auditorId: {_eq: $userid}, grade: {_is_null: false}}) {
                        auditorId
                        grade
                    }
                }
            `;

            const variables = { userid: parseInt(userid, 10) };
            const data = await makeGraphQLRequest(query, variables);
            displayPieChart(data.data.audit);
        }

        async function makeGraphQLRequest(query, variables = {}) {
            const response = await fetch(GRAPHQL_API, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, variables })
            });

            const responseText = await response.text();
            if (!response.ok) {
                throw new Error(`GraphQL error: ${responseText}`);
            }

            return JSON.parse(responseText);
        }

        async function displayPieChart(audits) {
    const svgContainer = d3.select("#audit-chart").append("svg")
        .attr("width", 200)
        .attr("height", 200);

    const radius = Math.min(200, 200) / 2;
    const centerX = 200 / 2;
    const centerY = 200 / 2;

    const passCount = audits.filter(audit => audit.grade >= 1).length;
    const failCount = audits.filter(audit => audit.grade < 1).length;
    const total = passCount + failCount;

    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const pieData = [
        { value: passCount, color: '#4CAF50', label: `${passCount} Pass` },
        { value: failCount, color: 'red', label: `${failCount} Fail` }
    ];

    const pie = d3.pie().value(d => d.value);

    const arcs = svgContainer.selectAll('g.arc')
        .data(pie(pieData))
        .enter()
        .append('g')
        .attr('class', 'arc')
        .attr('transform', `translate(${centerX}, ${centerY})`);

        arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => d.data.color)
    .on("mouseover", function(event, d) {
        const tooltip = d3.select("#tooltip");
        tooltip.style("opacity", 1)
               .html(d.data.label)
               .style("left", (event.pageX) + "px") // Center tooltip horizontally
               .style("top", (event.pageY - 40) + "px"); // Position above cursor
    })
    .on("mousemove", function(event) {
        d3.select("#tooltip")
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 40) + "px");
    })
    .on("mouseout", function() {
        d3.select("#tooltip").style("opacity", 0);
    });

    // Tooltip container
    d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("opacity", 0);
    
    // Center text
    svgContainer.append("text")
        .attr("x", centerX)
        .attr("y", centerY)
        .attr("text-anchor", "middle")
        .attr("class", "text-label")
       // .text(`${passCount} Pass / ${failCount} Fail`);
}
        
        
        
        function Logout() {
            console.log("Logout function called"); // Debugging log
            const token = localStorage.getItem("token");
            if (token) {
                localStorage.removeItem("token");
                console.log("Token removed, redirecting..."); // Debugging log
            } else {
                console.log("No token found"); // Debugging log
            }
            window.location.href = "login.html";
        }

        renderUserProfile();