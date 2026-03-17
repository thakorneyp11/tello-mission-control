from djitellopy import Tello
import time

t = Tello()
t.connect()
battery = t.get_battery()
print(f'Battery: {battery}%')

# if battery < 30:
#     print('Battery too low for tricks! Charge the drone first.')
#     exit()

try:
    t.takeoff()
    time.sleep(2)

    # Rise up for visibility
    print('>> Rising to performance altitude')
    t.move_up(80)
    time.sleep(1)

    print('>> Landing!')
    t.land()

except Exception as e:
    print(f'Error during flight: {e}')
    t.land()
finally:
    t.end()
