<script>
    import {currentSpeed, distance, draw, voltage} from "./stores";
</script>

<div class="stats stats-vertical lg:stats-horizontal shadow font-black">

    <div class="stat">
        <div class="stat-title">Current Speed</div>
        <div class="stat-value">{$currentSpeed} mph</div>
    </div>

    <div class="stat">
        <div class="stat-title">Battery Voltage</div>
        <div class="stat-value">{$voltage} V</div>
    </div>

    <div class="stat">
        <div class="stat-title">Current Draw</div>
        <div class="stat-value">{$draw} A</div>
    </div>

    <div class="stat">
        <div class="stat-title">Sensor Distance</div>
        <div class="stat-value">{$distance} ft</div>
    </div>

</div>