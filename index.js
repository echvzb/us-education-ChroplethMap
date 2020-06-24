import getJSON from './getJSON.js'

const MAP_URL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

const DATA_URL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json'

const height = 600;
const width = 960;

const svg = d3.select('svg');
svg
    .attr('width', width)
    .attr('height',height);

const us = svg.append('g')
    .attr('class','us');

svg
    .call(d3.zoom()
        .on('zoom',()=>{
            us.attr('transform',d3.event.transform)
    }));


const render = ({map, data}) =>{
    const pathGenerator = d3.geoPath();
    const counties = topojson.feature(map, map.objects.counties)

    const max_min = d3.extent(data, d=>d.bachelorsOrHigher)

    const colorScale = d3.scaleLinear(max_min)
    .domain(max_min)
    .range(['#EBE4F9','#5F27CD']);


    const leyendValues = [3, 12,21,30,48,57,66,75]
    const colorSize = {
        width: 40,
        height:10,
    }

    const leyend = svg.append('g')
        .attr('transform',`translate(${width-colorSize.width*9},10)`)

    const leyends = leyend.selectAll('g').data(leyendValues);

    const leyendsEnter = leyends.enter().append('g')
        .attr('transform', (d,i)=> `translate(${i*colorSize.width},0)`);

    leyendsEnter.append('rect')
        .attr('fill', d=> colorScale(d))
        .attr('width', colorSize.width)
        .attr('height', colorSize.height);
    leyendsEnter.append('text')
        .text(d=>d+'%')
        .attr('class','leyend-txt')
        .attr('y', colorSize.height*3);
    
    leyendsEnter.append('rect')
        .attr('height', colorSize.height*1.5)
        .attr('width', 1);
    const div = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    const tooltip = ({area_name,state,education}) =>{
        return area_name+', '+state+': '+education+'%'
    }

    //County
    us.selectAll('.counties').data(counties.features)
    .enter()
        .append('path')
            .attr('d', pathGenerator)
            .attr('class','county')
            .attr('data-fips', d=>d.id)
            .attr('data-education', d=>{
                let temp = data.filter(elem=> elem.fips==d.id);

                if(temp){
                    d['education'] = temp[0].bachelorsOrHigher;
                    d['state'] = temp[0].state;
                    d['area_name'] = temp[0].area_name;
                    return d.education;  
                } 
                return '';
            })
            .attr('fill', d => colorScale(d.education))
            .on("mouseover", (d) => {
                div.transition().duration(200).style("opacity", 0.9);
                div
                  .html(tooltip(d))
                  .style("left", d3.event.pageX + "px")
                  .style("top", d3.event.pageY + "px");
              })
            .on("mouseout", (d) => {
                div.transition().duration(500).style("opacity", 0);
            });

        us.append('path')
            .datum(topojson.mesh(map, map.objects.states, (a, b) => a !== b))
            .attr('d', pathGenerator)
            .attr('class', 'states');
}
Promise.all([
    getJSON(MAP_URL),
    getJSON(DATA_URL)
]).then(values=>{
    render({
        map: values[0],
        data:values[1]
    })
})