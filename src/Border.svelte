<script>
    import {screenHeight, screenWidth} from "./stores";
</script>


<svg width={$screenWidth} height={$screenHeight} class="fixed">
    <rect width={$screenWidth} height={$screenHeight} style="fill:none;stroke-width:5;stroke:black"/>
</svg>